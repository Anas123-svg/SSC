// Slippy-map / Web Mercator projection, in 256px OpenStreetMap tiles.
export const TILE_SIZE = 256;
export const MAX_LATITUDE = 85.05112878;
export const clampLatitude = lat => Math.max(-MAX_LATITUDE, Math.min(MAX_LATITUDE, Number(lat)));
export const wrapLongitude = lng => ((Number(lng) + 180) % 360 + 360) % 360 - 180;
export const validCoordinate = (lat, lng) => lat !== '' && lng !== '' && lat != null && lng != null && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng)) && Number(lat) >= -90 && Number(lat) <= 90 && Number(lng) >= -180 && Number(lng) <= 180;
export function project(lat, lng, zoom) {
  const scale = TILE_SIZE * 2 ** zoom;
  const phi = clampLatitude(lat) * Math.PI / 180;
  return { x: (wrapLongitude(lng) + 180) / 360 * scale, y: (1 - Math.asinh(Math.tan(phi)) / Math.PI) / 2 * scale };
}
export function unproject(x, y, zoom) {
  const scale = TILE_SIZE * 2 ** zoom;
  return { lat: Math.atan(Math.sinh(Math.PI * (1 - 2 * Math.max(0, Math.min(scale, y)) / scale))) * 180 / Math.PI, lng: wrapLongitude(x / scale * 360 - 180) };
}
export function mapTiles(center, zoom, width, height) {
  const world = TILE_SIZE * 2 ** zoom;
  const p = project(center.lat, center.lng, zoom);
  const left = p.x - width / 2;
  const top = p.y - height / 2;
  const minX = Math.floor(left / TILE_SIZE);
  const maxX = Math.floor((left + width) / TILE_SIZE);
  const minY = Math.max(0, Math.floor(top / TILE_SIZE));
  const maxY = Math.min(2 ** zoom - 1, Math.floor((top + height) / TILE_SIZE));
  const result = [];
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const tileX = ((x % 2 ** zoom) + 2 ** zoom) % 2 ** zoom;
      result.push({ key: `${zoom}-${x}-${y}`, url: `https://tile.openstreetmap.org/${zoom}/${tileX}/${y}.png`, left: x * TILE_SIZE - left, top: y * TILE_SIZE - top });
    }
  }
  return result;
}
