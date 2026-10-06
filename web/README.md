# FeDairy browser foundation

Run from the repository root:

```sh
npm install
npm run web:dev
```

Open http://127.0.0.1:5173. The browser build shares the native screens and green theme through React Native Web. It uses separate entry/config/navigation files; Android still uses Metro and the original native entry point.

```sh
npm run web:build       # emits dist-web/
npm run web:preview     # serves the built app on http://127.0.0.1:4173
npm test -- --runInBand --watchman=false
```

Use a Node version supported by React Native (22.13+ in the 22.x line or 24.3+ in the 24.x line). The local Node 25.2.1 ran these checks but produces existing React Native engine warnings.

## API configuration

No environment file is necessary for local development: Vite forwards `/api` to the existing HTTPS backend. This proxy is local development infrastructure, not a deployed API or an authentication mechanism. It has a 20-second upstream timeout; a slow backend may require Retry.

Optional root `.env.local` values are documented in `.env.web.example`:

- `VITE_API_BASE_URL`: browser-visible endpoint, either HTTPS URL or same-origin path. Defaults to `/api` in development and the existing Render URL in production. Never put credentials here.
- `WEB_API_PROXY_TARGET`: development proxy destination. Defaults to the existing Render URL.

Restart Vite after environment changes; rebuild to change production configuration. Setting an absolute `VITE_API_BASE_URL` bypasses the development proxy and requires server CORS.

**Verified release blocker:** on 6 October 2026, direct API GET and OPTIONS responses lacked Access-Control-Allow-Origin (and preflight allow headers). Production preview rendered correctly but its browser data requests failed. The local proxy returned HTTP 200. Before deployment, configure backend CORS for the chosen origin or configure a same-origin production API proxy and build with its path. The Vite development proxy does not ship in `dist-web`.

Production hosting must serve `index.html` for application routes such as `/production/new`. Missing static assets must remain 404s. Hosting, install manifest/service worker, and offline/update behavior are later milestones.

## Foundation scope

Available now: browser app entry, all six tabs, mapped URLs, not-found page, native-stack web navigation, green responsive shell, browser dates and real dialogs, existing shared screen rendering, local API configuration/proxy.

Deliberate later work:

- `PhotoPicker.web.js` displays existing photos and explicitly explains that web uploads are not available yet (milestone 3).
- `pdfService.web.js` reports export as unavailable and returns success:false; it never pretends a file was saved (milestone 6).
- Existing object-backed detail/edit pages still require navigation from their list. They use temporary `/detail` and `/edit` paths; milestone 4 will implement stable IDs and reload hydration. Object params are stripped from URLs, not from in-app state.
- Greeting playback, PWA installation, offline handling, complete per-module verification, and real-iPhone validation remain in PWA_PLAN.md.

## Platform boundaries

Vite prefers `.web.*`, translates the two Metro image requires in app source, and aliases only the exact `react-native` import to a web facade. That facade re-exports React Native Web and supplies an Alert dialog with preserved callbacks. Native builds retain their real date picker, image picker, PDF share module and greeting players. Existing native dependency versions were not changed.

`BottomTabNavigator.web.js` preserves the native tab/stack structure with web-specific bar sizing and a hidden not-found destination. Keep route additions synchronized with the native navigator and `web/linking.js`. Tests cover direct form routing, not-found routing and omission of record objects from URLs.
