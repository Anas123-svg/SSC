import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, Crosshair, LoaderCircle, MapPin, Minus, Plus, Search, Target } from 'lucide-react';
import { clampLatitude, mapTiles, project, unproject, validCoordinate, wrapLongitude } from '../../utils/mapCoordinates.js';

const LONDON = { lat: 51.5074, lng: -0.1278 };
const fmt = value => Number(value).toFixed(6);

/** A dependency-free interactive OpenStreetMap picker. The marker coordinates
 * (not just a text address) are saved in the project record. Tile attribution
 * and explicit, non-autocomplete Nominatim search respect OSM usage guidelines.
 */
export default function ProjectLocationPicker({ latitude, longitude, onChange, onAddressFound }) {
  const hasPin = validCoordinate(latitude, longitude);
  const pin = hasPin ? { lat: Number(latitude), lng: Number(longitude) } : null;
  const [center, setCenter] = useState(pin || LONDON);
  const [zoom, setZoom] = useState(pin ? 15 : 11);
  const [size, setSize] = useState({ width: 540, height: 345 });
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [tileFailed, setTileFailed] = useState(false);
  const hostRef = useRef(null);
  const gesture = useRef(null);
  const lastSearch = useRef(0);
  const abort = useRef(null);

  useEffect(() => {
    if (!hostRef.current) return;
    const observer = new ResizeObserver(entries => {
      const rect = entries[0]?.contentRect;
      if (rect) setSize({ width: Math.max(1, rect.width), height: Math.max(1, rect.height) });
    });
    observer.observe(hostRef.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => () => abort.current?.abort(), []);

  const tiles = useMemo(() => mapTiles(center, zoom, size.width, size.height), [center, zoom, size]);
  const marker = useMemo(() => {
    if (!pin) return null;
    const c = project(center.lat, center.lng, zoom);
    const p = project(pin.lat, pin.lng, zoom);
    const worldSize = 256 * 2 ** zoom;
    const dx = ((p.x - c.x + worldSize / 2) % worldSize + worldSize) % worldSize - worldSize / 2;
    return { left: size.width / 2 + dx, top: size.height / 2 + p.y - c.y };
  }, [latitude, longitude, center, zoom, size]);

  const pointFor = (x, y, currentCenter = center) => {
    const current = project(currentCenter.lat, currentCenter.lng, zoom);
    return unproject(current.x + x - size.width / 2, current.y + y - size.height / 2, zoom);
  };
  const pick = position => {
    onChange({ latitude: fmt(position.lat), longitude: fmt(position.lng) });
    setError('');
  };
  const pointerDown = event => {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, center, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const pointerMove = event => {
    const g = gesture.current;
    if (!g || g.id !== event.pointerId) return;
    const dx = event.clientX - g.x, dy = event.clientY - g.y;
    if (Math.abs(dx) + Math.abs(dy) > 5) g.moved = true;
    if (!g.moved) return;
    const original = project(g.center.lat, g.center.lng, zoom);
    setCenter(unproject(original.x - dx, original.y - dy, zoom));
  };
  const pointerUp = event => {
    const g = gesture.current;
    if (!g || g.id !== event.pointerId) return;
    if (!g.moved) {
      const rect = event.currentTarget.getBoundingClientRect();
      pick(pointFor(event.clientX - rect.left, event.clientY - rect.top, g.center));
    }
    gesture.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const moveZoom = direction => setZoom(value => Math.max(2, Math.min(19, value + direction)));
  const findAddress = async event => {
    event.preventDefault();
    const q = query.trim();
    if (q.length < 3 || searching) { setError('Enter at least 3 characters to search a place.'); return; }
    // Public Nominatim is limited to one request per second. No background autocomplete.
    if (Date.now() - lastSearch.current < 1100) { setError('Please allow a second between searches.'); return; }
    lastSearch.current = Date.now();
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setSearching(true); setError('');
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(q)}`, { signal: controller.signal, headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('The location service is temporarily unavailable.');
      const found = await response.json();
      if (!Array.isArray(found) || !found.length) { setError('No matching location found. Try a full address or city.'); return; }
      const first = found[0];
      const result = { lat: Number(first.lat), lng: Number(first.lon) };
      if (!validCoordinate(result.lat, result.lng)) throw new Error('The location service returned an invalid position.');
      setCenter(result); setZoom(16); pick(result);
      onAddressFound?.(first.display_name || q);
    } catch (reason) {
      if (reason.name !== 'AbortError') setError(reason.message === 'Failed to fetch' ? 'Could not reach the map search service. You can still select a pin or enter coordinates manually.' : reason.message);
    } finally { if (!controller.signal.aborted) setSearching(false); }
  };
  const locate = () => {
    if (!navigator.geolocation) { setError('Geolocation is not available in this browser.'); return; }
    setError('');
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const pos = { lat: clampLatitude(coords.latitude), lng: wrapLongitude(coords.longitude) };
      setCenter(pos); setZoom(16); pick(pos);
    }, () => setError('Location permission was denied or unavailable. Search or click the map instead.'), { enableHighAccuracy: false, timeout: 12000 });
  };
  const keyboard = event => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); pick(center); return; }
    if (event.key === '+' || event.key === '=') { event.preventDefault(); moveZoom(1); return; }
    if (event.key === '-') { event.preventDefault(); moveZoom(-1); return; }
    const deltas = { ArrowUp: [0, -100], ArrowDown: [0, 100], ArrowLeft: [-100, 0], ArrowRight: [100, 0] };
    if (deltas[event.key]) {
      event.preventDefault();
      const p = project(center.lat, center.lng, zoom);
      const [dx, dy] = deltas[event.key];
      setCenter(unproject(p.x + dx, p.y + dy, zoom));
    }
  };

  return <div className="ssc-pmap">
    <form className="ssc-pmap-search" onSubmit={findAddress}>
      <label className="ssc-pmap-search-input"><Search size={16}/><input aria-label="Find a project address on the map" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search address, postcode or city"/></label>
      <button type="submit" disabled={searching}>{searching ? <LoaderCircle size={16} className="ssc-pmap-spin"/> : <Search size={16}/>}<span>Find</span></button>
    </form>
    <div className="ssc-pmap-surface" ref={hostRef}>
      <div className="ssc-pmap-tiles" role="application" tabIndex={0} aria-label="Interactive location map. Click to place a project pin, drag to pan. Arrow keys pan, plus and minus keys zoom, Enter pins the map center." onKeyDown={keyboard} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={() => {gesture.current = null;}}>
        {tiles.map(tile => <img key={tile.key} src={tile.url} alt="" draggable={false} onError={() => setTileFailed(true)} style={{ left: tile.left, top: tile.top }} />)}
        {marker && marker.left >= -20 && marker.left <= size.width + 20 && marker.top >= -20 && marker.top <= size.height + 20 && <div className="ssc-pmap-pin" style={{ left: marker.left, top: marker.top }} aria-hidden="true"><MapPin size={34} fill="#d84b73" color="#fff" strokeWidth={1.7}/></div>}
        {!pin && <div className="ssc-pmap-hint"><Target size={15}/> Click on the map to drop a pin</div>}
        {tileFailed && <div className="ssc-pmap-tile-error">Map imagery unavailable. Check your connection; you can enter coordinates below.</div>}
      </div>
      <div className="ssc-pmap-buttons">
        <button type="button" onClick={() => moveZoom(1)} title="Zoom in" aria-label="Zoom in"><Plus size={18}/></button>
        <button type="button" onClick={() => moveZoom(-1)} title="Zoom out" aria-label="Zoom out"><Minus size={18}/></button>
        <button type="button" onClick={locate} title="Use my current location" aria-label="Use my current location"><Crosshair size={18}/></button>
        {pin && <button type="button" onClick={() => { setCenter(pin); setZoom(16); }} title="Centre on selected site" aria-label="Centre on selected site"><Target size={18}/></button>}
      </div>
      <div className="ssc-pmap-attribution">© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a></div>
    </div>
    {error && <p className="ssc-pmap-error" role="alert">{error}</p>}
    <div className="ssc-pmap-coordinates"><div><MapPin size={15}/>{pin ? <span>Site selected: <strong>{fmt(pin.lat)}, {fmt(pin.lng)}</strong></span> : <span>No map pin selected</span>}</div>{pin && <a href={`https://www.openstreetmap.org/?mlat=${pin.lat}&mlon=${pin.lng}#map=17/${pin.lat}/${pin.lng}`} target="_blank" rel="noreferrer">Open map <ArrowUpRight size={14}/></a>}</div>
  </div>;
}
