# Project cards — real maps and construction photographs

The directory cards show **both** a real construction photograph and an OpenStreetMap preview.

## Photos
- User-uploaded project photos remain authoritative, stored locally in the existing project data as a compressed data URL.
- A project can now also save an `https://` link in the **Online site photo URL** field. Uploads take priority.
- If neither exists, real, licensed Unsplash construction/architecture photographs appear with a **Reference photo** label and photographer link. These images are illustrative **references**, not claimed to be actual site photos.
- If an image does not load, the card shows a clear unavailable state. No generated "fake" photographs remain.
- Images are delivered directly from `images.unsplash.com` with no new API keys.
- Verified photo pages, IDs, authors and alt text are documented in `src/data/projectCardPhotos.js`.

## Maps
- Projects with saved coordinates use a real OpenStreetMap tile preview (four tiles maximum, at zoom 15) and a true site pin.
- Bundled demo project records have no street address, only a city. A city-area map (zoom 12) is shown for them, based on documented city-centre coordinates. These maps show real map content but are **not exact site locations**; no inaccurate marker is displayed.
- User-created projects without a saved site pin show the prompt **Add a site pin to show the map**. Choose an exact location using the existing Project Location Picker.
- Every displayed map includes OpenStreetMap attribution and a link to open it in full.
- Offline, remote map tiles can be unavailable. The inspection app continues to function; only optional imagery is affected.

## Updating and testing
- Run `npm ci && npm run build && npm test` in a network-connected Node 22 environment.
- The source parser and all twelve focused theme/media tests pass. The complete test suite has seven previously existing failures from the upstream v3 package.
- With access to the internet, check Unsplash CDN delivery, OpenStreetMap tile loading, attribution, user-uploaded photographs, and new map-pin cards in the deployed app.
- Source work is done; a production browser screenshot and network validation were not available in this environment.
