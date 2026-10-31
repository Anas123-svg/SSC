import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DEMO_CITY_CENTRES, cardMapLocation } from '../src/data/projectCardLocations.js';
import { REFERENCE_PROJECT_PHOTOS, referencePhotoFor, secureImageUrl } from '../src/data/projectCardPhotos.js';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('sample project city gets a real city-area map, never an invented site pin', () => {
  assert.deepEqual(Object.keys(DEMO_CITY_CENTRES).sort(), ['birmingham','bristol','coventry','leeds','liverpool','london','manchester','nottingham','oxford','reading','sheffield']);
  const sample = cardMapLocation({ id:'S-1', address:'Manchester' });
  assert.equal(sample.precise, false);
  assert.equal(sample.zoom, 12);
  assert.equal(sample.label, 'Manchester area');
  assert.equal(cardMapLocation({id:'my-real-project', address:'King Street, Manchester'}), null);
  assert.equal(cardMapLocation({id:'S-1', address:'Not a city'}), null);
});

test('real project coordinates take precedence, including zero coordinates', () => {
  const map = cardMapLocation({id:'S-1', address:'Manchester', latitude:0, longitude:0});
  assert.equal(map.precise,true);
  assert.equal(map.zoom,15);
  assert.equal(map.latitude,0);
});

test('real credited online photographs are provided and no generated fake-photo fallback remains', () => {
  assert.ok(REFERENCE_PROJECT_PHOTOS.length >= 6);
  for (const image of REFERENCE_PROJECT_PHOTOS) {
    assert.match(image.image, /^https:\/\/images\.unsplash\.com\/photo-/);
    assert.match(image.page, /^https:\/\/unsplash\.com\/photos\//);
    assert.ok(image.credit && image.alt);
  }
  assert.ok(referencePhotoFor({id:'S-1'}).image !== referencePhotoFor({id:'S-2'}).image);
  const jsx = read('src/components/projects/ProjectCardMedia.jsx');
  assert.match(jsx, /tile\.openstreetmap\.org/);
  assert.match(jsx, /reference\.page/);
  assert.match(jsx, /OpenStreetMap contributors/);
  assert.match(jsx, /Reference photo/);
  assert.match(jsx, /location\.precise &&/);
  assert.doesNotMatch(jsx, /demoProjectPhoto|demoProjectMap/);
});

test('linked photo URLs must be HTTPS and can be entered in project settings', () => {
  assert.equal(secureImageUrl('http://example.com/a.jpg'), null);
  assert.equal(secureImageUrl('javascript:alert(1)'), null);
  assert.equal(secureImageUrl('https://user:password@example.com/p.jpg'), null);
  assert.equal(secureImageUrl('https://example.com/p.jpg'), 'https://example.com/p.jpg');
  assert.match(read('src/pages/ProjectFormPage.jsx'), /photoUrl/);
});
