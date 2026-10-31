import { validCoordinate } from '../utils/mapCoordinates.js';

/**
 * Approximate city-centre coordinates for the FICTIONAL seeded demo projects.
 * These show genuine OpenStreetMap streets in the named city, but are never
 * treated as the project's actual address or a verified site pin.
 * Source: geodatos.net/en/coordinates/united-kingdom and city lists.
 */
export const DEMO_CITY_CENTRES = Object.freeze({
  manchester: [53.48095, -2.23743],
  birmingham: [52.48142, -1.89983],
  leeds: [53.79648, -1.54785],
  london: [51.50853, -0.12574],
  liverpool: [53.41058, -2.97794],
  bristol: [51.45523, -2.59665],
  nottingham: [52.95360, -1.15047],
  sheffield: [53.38297, -1.46590],
  coventry: [52.40682, -1.51969],
  reading: [51.45625, -0.97113],
  oxford: [51.75200, -1.25770],
});

export function cardMapLocation(project) {
  // User-confirmed location always wins. Zero is a valid coordinate.
  if (validCoordinate(project.latitude, project.longitude)) return {
    latitude: Number(project.latitude), longitude: Number(project.longitude),
    precise: true, label: 'Site location', zoom: 15,
  };
  // Only the bundled demo projects are given city-centre fallback maps.
  // Never infer a pin for an arbitrary user-created street address.
  if (!/^S-(?:[1-9]|1[0-2])$/.test(String(project.id))) return null;
  const city = String(project.address || project.location || '').trim().toLowerCase();
  const coordinates = DEMO_CITY_CENTRES[city];
  if (!coordinates) return null;
  return { latitude: coordinates[0], longitude: coordinates[1],
    precise: false, label: `${city.charAt(0).toUpperCase() + city.slice(1)} area`, zoom: 12 };
}
