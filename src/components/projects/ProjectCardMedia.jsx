import React, { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Image as ImageIcon, MapPin, MapPinned } from 'lucide-react';
import { validCoordinate } from '../../utils/mapCoordinates.js';
import { cardMapLocation } from '../../data/projectCardLocations.js';
import { referencePhotoFor, secureImageUrl } from '../../data/projectCardPhotos.js';

/** A small real OpenStreetMap map preview, with at most four on-demand tiles. */
export function osmTile(latitude, longitude, zoom = 14) {
  if (!validCoordinate(latitude, longitude)) return null;
  const lat = Math.max(-85.0511, Math.min(85.0511, Number(latitude)));
  const lon = Number(longitude);
  const n = 2 ** zoom;
  const x = (lon + 180) / 360 * n;
  const sin = Math.sin(lat * Math.PI / 180);
  const y = (1 - Math.log((1 + sin) / (1 - sin)) / (2 * Math.PI)) / 2 * n;
  const tx = Math.min(n - 1, Math.max(0, Math.floor(x)));
  const ty = Math.min(n - 1, Math.max(0, Math.floor(y)));
  return { tileX: tx, tileY: ty, zoom, size: n,
    offsetX: Math.round((x - tx) * 256), offsetY: Math.round((y - ty) * 256) };
}

export default function ProjectCardMedia({ project }) {
  const reference = useMemo(() => referencePhotoFor(project), [project.id, project.name]);
  const uploaded = typeof project.photo === 'string' && /^data:image\/(jpeg|png|webp);base64,/i.test(project.photo) ? project.photo : null;
  const linked = secureImageUrl(project.photoUrl);
  const [linkedError, setLinkedError] = useState(false);
  const [referenceError, setReferenceError] = useState(false);
  const source = uploaded ? 'uploaded' : linked && !linkedError ? 'linked' : 'reference';
  const photo = source === 'uploaded' ? uploaded : source === 'linked' ? linked : reference.image;
  const location = useMemo(() => cardMapLocation(project), [project.id, project.latitude, project.longitude, project.address, project.location]);
  const tile = location ? osmTile(location.latitude, location.longitude, location.zoom) : null;
  const [tileError, setTileError] = useState(false);
  useEffect(() => {
    const retry = () => setTileError(false);
    window.addEventListener('online', retry);
    return () => window.removeEventListener('online', retry);
  }, []);
  useEffect(() => setTileError(false), [location?.latitude, location?.longitude, location?.zoom]);
  // Two tiles in each direction frame the centre even when it sits at a tile edge.
  const mapTiles = useMemo(() => {
    if (!tile) return [];
    const firstX = tile.offsetX >= 128 ? 0 : -1;
    const firstY = tile.offsetY >= 128 ? 0 : -1;
    return [firstY, firstY + 1].flatMap(dy => [firstX, firstX + 1]
      .map(dx => ({ dx, dy, x: (tile.tileX + dx + tile.size) % tile.size, y: tile.tileY + dy }))
      .filter(item => item.y >= 0 && item.y < tile.size));
  }, [tile?.tileX, tile?.tileY, tile?.zoom, tile?.offsetX, tile?.offsetY]);
  const mapUrl = location ? `https://www.openstreetmap.org/#map=${location.zoom}/${location.latitude}/${location.longitude}` : null;

  return <div className="ssc-project-media" aria-label={`Photograph and map for ${project.name}`}>
    <div className="ssc-project-media-grid">
      <figure className="ssc-project-media-panel ssc-project-media-panel-photo">
        {(!referenceError || source !== 'reference') ? <img src={photo} alt={source === 'reference' ? `Representative photo: ${reference.alt}. Not a photo of ${project.name}.` : `${project.name} site photograph`}
          className="ssc-project-photo" loading="lazy" decoding="async" referrerPolicy="no-referrer"
          onError={() => { if (source === 'linked') setLinkedError(true); else if (source === 'reference') setReferenceError(true); }}/>
          : <div className="ssc-project-media-unavailable"><ImageIcon size={21}/><span>Reference photo unavailable</span></div>}
        <figcaption className="ssc-project-media-chip"><ImageIcon size={13}/><span>{source === 'reference' ? 'Reference photo' : 'Site photo'}</span></figcaption>
        {source === 'reference' && <a className="ssc-project-photo-credit" href={reference.page} target="_blank" rel="noopener noreferrer" aria-label={`Photo by ${reference.credit} on Unsplash (opens in a new tab)`} title={`Representative construction photo by ${reference.credit} · Unsplash`}>{reference.credit} · Unsplash <ExternalLink size={11}/></a>}
      </figure>
      <figure className="ssc-project-media-panel ssc-project-media-panel-map">
        <div className="ssc-project-map">
          {tile && !tileError ? <>
            {mapTiles.map(item => <img key={`${tile.zoom}-${item.x}-${item.y}`} loading="lazy" decoding="async"
              src={`https://tile.openstreetmap.org/${tile.zoom}/${item.x}/${item.y}.png`}
              alt="" onError={() => setTileError(true)} style={{ left:`calc(50% - ${tile.offsetX}px + ${item.dx * 256}px)`, top:`calc(50% - ${tile.offsetY}px + ${item.dy * 256}px)` }}/>) }
            {location.precise && <span className="ssc-project-map-pin"><MapPin size={22} fill="currentColor"/></span>}
            <a className="ssc-project-attribution" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a>
          </> : <div className="ssc-project-media-unavailable"><MapPinned size={22}/><span>{tile ? 'Map tiles unavailable' : 'Add a site pin to show the map'}</span></div>}
        </div>
        <figcaption className="ssc-project-media-chip"><MapPin size={13}/><span>{location ? location.precise ? 'Site map' : `${location.label} map` : 'Site map'}</span></figcaption>
        {mapUrl && <a className="ssc-project-map-open" href={mapUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open ${location.label} on OpenStreetMap`} title="Open full map"><ExternalLink size={14}/></a>}
      </figure>
    </div>
  </div>;
}
