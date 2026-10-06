# FeDairy PWA migration plan

Audit date: 6 October 2026 (Asia/Kolkata)
Status: milestone 2 browser foundation implemented and running locally; production API CORS and native runtime/device checks remain open.

## Objective and boundaries

Make FeDairy usable in iPhone Safari and installable from the Home Screen, while preserving the existing Android app, green theme, API contracts, calculations, and form behavior. Build in this repository in stages. Milestone 1 was documentation-only. Milestone 2 adds the separate browser foundation described in the implementation record below; no backend changes or deployment have been made.

The first PWA release requires internet for records and saves. Offline synchronization, push notifications, new business features, and an Expo/native migration are outside this plan. Profile and Settings are currently placeholders and should remain so unless separately requested.

## Recommendation

Add a separate browser build using React Native Web, React DOM, and Vite, sharing the existing screens and business code where compatible. Keep Metro, the native entry point, Android, and iOS intact. Use `.web.js`/`.web.tsx` adapters at browser-specific boundaries, with existing files remaining native defaults. Pin compatible versions after a small build/navigation spike; React 19.2.3 and React Native 0.87.1 are the current package declarations, not proof that every web dependency combination will work.

This is a recommendation based on the source audit, not a verified web build. The foundation milestone must demonstrate development AND production builds before porting all screens. Existing JSX in `.js`, native package imports, Metro asset `require()` calls, and platform file resolution need explicit bundler handling. Web resolution must prefer `.web.*`; the native build must never import browser DOM code. Resolve React once and use a matching React DOM version.

Why this approach:

- Most UI uses React Native core primitives, with reusable hooks and JavaScript calculations. React Native Web offers a reuse path without rewriting every screen.
- Keeping native entry points and existing modules isolates changes from Android.
- React Navigation already structures the app; preserve route names and navigation semantics while adding browser URLs.
- A separate React DOM application would isolate UI more completely, but duplicate screens, validations, and ongoing maintenance. Use it only if the foundation spike exposes substantial compatibility problems.
- Expo is a valid universal-app approach, but migrating the existing native build is unnecessary for this goal. Do not upgrade React Native or convert native projects merely to obtain a web target.

Proposed additions (not created): browser entry under `web/`, web-only Vite config, public manifest/icons/audio, platform adapters alongside existing modules, browser test configuration, and separate `web:dev`, `web:build`, and `web:preview` scripts. Keep native scripts working. Choose exact tooling versions in milestone 2, not blindly from latest releases.

## Source findings and reusable code

### Runtime and structure

- `package.json`: bare React Native 0.87.1, React 19.2.3, React Navigation 7; no web build scripts, React DOM, React Native Web, manifest, or service worker configured.
- `App.tsx`: SafeAreaProvider wraps RootNavigator.
- `src/navigation/RootNavigator.js`: NavigationContainer has no linking configuration.
- `src/navigation/BottomTabNavigator.js`: Home, Animals, Production, Purchase, Sales, and More; five nested native-stack navigators.
- `src/navigation/MoreNavigator.js`: sellers, customers, their billing flows, employees/salaries/transactions, expenses, breeding, vaccines, Profile, and Settings. These are real migration scope, not just the main tabs.

### High-reuse candidates

- `src/api/decentralizedWrapper.js`: fetch-based JSON requests and multipart entry point. Retain endpoints, methods, payload shapes, and server-error handling. Browser CORS and environment configuration require verification.
- `src/utils/date.js`, `dateRanges.js`, `format.js`, `milkRates.js`, `numberToWords.js`, `billTransactions.js`: reusable calculations/formatting; retain date-only semantics and test timezone boundaries.
- `src/utils/purePdfBuilder.js`, `pdfImage.js`, `pdfText.js`, `billTemplate.js`, `src/assets/billBrandImages.js`: reusable PDF/bill construction and embedded branding. The PDF delivery service is the native boundary, not the generator.
- `src/constants/`: colors, enums, brand, spacing and typography. `appConstants.js` contains Platform-selected shadows, which need browser styling verification.
- Data hooks: `useDashboardData`, `useProductionRecords`, `usePurchaseRecords`, `useSalesRecords`. Preserve focus refresh and filters; verify browser back/forward and foreground refresh behavior.
- Form validation is largely embedded in screen components. Reuse the screens or carefully extract shared validation; do not create an independent set of browser business rules.
- Cards, fields, rows, charts, lists, photo displays, and modals are reuse candidates, subject to browser layout/accessibility checks. No exact reuse percentage is established by this audit.

## Browser adapters and compatibility work

### Photos and uploads

`PhotoPicker.js` imports `react-native-image-picker`; `uploadImage.js` appends a React Native `{ uri, type, name }` object to FormData. That object is not a browser file upload.

Plan: web file input and optional camera selection, actual File/Blob multipart part named `file`, existing `/upload` response `{ url }`, and unchanged `imageUrl` payloads. Keep JPG/PNG/WEBP and 3 MB validation. Verify iPhone HEIC handling and orientation with a real phone; convert only supported decoded formats and provide a clear fallback if conversion is unavailable. Preserve resizing intent (1600px, JPEG quality 0.85 where applicable), cancellation, busy state, and prevention of saves during uploads. Release preview object URLs. Check HTTPS image URLs and cross-origin access separately from API CORS.

### Dates, alerts, and forms

- `AppDatePicker.js` uses `@react-native-community/datetimepicker` and Android imperative APIs. Supply a web date input behind the same component contract, preserving min/max and date-only values.
- Many screens call `Alert.alert`, including callbacks that navigate after success. Implement a shared alert interface with native and web implementations; preserve button callbacks, dismissal, and error semantics. A silent shim would break workflows.
- `AppSelect.js`, `PhotoPreview.js`, and `BillPreviewModal.js` use modal UI. Verify keyboard focus, Escape/back dismissal, focus return, scrolling, and accessibility.
- `KeyboardAvoidingView`, Keyboard events, RefreshControl, input keyboard types, shadows, and touch feedback need browser-specific behavior or graceful fallbacks. Prevent Safari input zoom and clipped fields without disabling user zoom.

### PDF export and sharing

`pdfService.js` directly imports `react-native-share`. Keep it native and add a browser adapter that builds a PDF Blob/File from the existing generator, with download/open fallback and Web Share file support when `navigator.canShare` permits it. Sharing must originate from a user action. Treat cancellation as cancellation, not a successful export or an alarming error. Preserve seller/customer filenames, totals, pagination, logo, and seal. Test actual PDF output and iPhone Save to Files/share behavior; desktop success is not sufficient.

### Greeting audio

The greeting currently lives in `android/.../MainActivity.kt` and `ios/FeDairy/AppDelegate.swift`, with a persisted one-hour cooldown; it is not driven by App.tsx. Reuse `assets/audio/welcome_hi.wav` in a web-only service. Browser audio may require a user gesture: show an unobtrusive play/enable action when autoplay is rejected. Never promise automatic sound on every iPhone launch. Record the timestamp only after playback successfully starts; check on launch/foreground, prevent overlapping playback, and handle unavailable storage. Native cooldown data and browser storage are separate.

### Draggable Add buttons and persistence

`DraggableAddButton.js` uses Animated, PanResponder, Keyboard, Vibration, and AsyncStorage; `floatingButtonPosition.js` is reusable geometry. Preserve compact '+ Add', independent per-screen saved positions, edge snapping, and tap-versus-drag behavior. Verify pointer/touch handling, scrolling, viewport resizing, keyboard visibility, and safe areas. Use the storage package's browser implementation if compatible, otherwise a thin browser adapter with failure handling. Do not depend on vibration on iPhone. Vaccines and Breeding retain their header-only Add controls.

### Other packages

- `react-native-safe-area-context`: reuse with verified web behavior; apply viewport-fit and safe-area CSS where necessary.
- `@react-navigation/native`, bottom-tabs, native-stack, and `react-native-screens`: verify installed versions in the foundation spike. Keep native-stack on Android. If its web behavior is insufficient, provide a web-only stack implementation without changing native navigation.
- `@react-native/new-app-screen`: present in dependencies but not used by App.tsx; no PWA feature to reproduce.
- Native Android/iOS welcome players, app icon resources, and share/file-provider configuration remain native. A PWA needs separate manifest and Apple touch icons with proper logo padding.

## Navigation and URL design

Preserve all existing routes in `src/navigation/routes.js`. Add a full nested linking map, page titles, not-found state, and hosting fallback to the SPA entry for direct URLs. Use link-aware controls for navigation where browser open-in-new-tab behavior matters.

Proposed route families:

- `/` dashboard; `/animals`, `/animals/new`, `/animals/:animalId`, `/animals/:animalId/edit`.
- `/production`, `/production/new`, `/production/history`, `/production/statistics`, `/production/filters`, `/production/:recordId`, `/production/:recordId/edit`.
- `/purchases` and `/sales`: list, new, ID details, and ID edit.
- `/more`; `/sellers` and `/customers`: list, new, ID details/edit and billing.
- `/employees` plus employee creation, salary creation, and salary transactions.
- `/expenses`: list, new, ID details; `/breeding`: list, new, ID edit; `/vaccines`: list and new.
- `/profile` and `/settings`: existing placeholders.

Critical migration: PurchaseDetailsScreen, SaleDetailsScreen, MilkProductionDetailScreen and associated edits currently use full record objects in route params. Animal details use animalId; expense details use expenseId and load records. Audit every edit/billing/salary route similarly. Put stable IDs and serializable filters in URLs; hydrate records from existing APIs on direct entry. Prefer existing detail endpoints; where absent, use existing list-and-find behavior initially and document the cost. Do not invent backend endpoints or encode entire personal/financial records into URLs.

Handle loading, missing/deleted IDs, failed requests, direct edit entry, browser back/forward, refresh, and safe back navigation when there is no prior history. Preserve production's stay-on-add-page save behavior, other form success behavior, and filter defaults. Query-string dates and enum filters must be validated.

## Backend and hosting readiness

`src/constants/config.js` points to `https://dairy-be-t8gm.onrender.com`. The transport does not attach auth tokens or credentials, and its comment explicitly says no JWT handling yet. This does not prove the deployed backend is unprotected; the deployed access policy remains unverified. Before sharing with the friend, establish whether they should access this same dairy dataset or need a separate account/dataset. Client-only hiding is not authorization.

- Confirm CORS for the exact localhost, preview, and production origins, including preflight for JSON requests, PATCH/PUT/DELETE, and multipart uploads. Native requests working does not establish browser access. Do not use `no-cors` as a workaround.
- Verify actual backend authentication/data isolation policy before public release. CORS is not an access-control substitute.
- Use a web-specific public API base setting; it is not a secret. Do not expose server credentials in build variables.
- Host over HTTPS with deep-link rewrites, correct MIME types, cache headers, and a stable origin. Provider/domain is undecided; no hosting account or deployment was selected in this audit.
- Test server validation, startup latency, failures, upload size limits, and repeat-submit protection against staging/test records. No live records were created during this audit.

## PWA and offline policy

Provide manifest (name, short name, stable id, start URL, scope, standalone display, colors), suitable regular/maskable icons and Apple touch icon, and iPhone Add to Home Screen guidance. Browser installation UI varies; do not rely solely on an automatic install prompt.

Cache versioned static app assets and an offline shell. Initially keep business API responses, uploads, PDFs, and mutation requests outside persistent service-worker caches. Offline shell should clearly say records require a connection. Never claim a save succeeded without server confirmation; do not queue or automatically replay mutations. A failed/lost response may require record refresh before manual retry to avoid duplicates.

Provide controlled updates: new version available, user-triggered reload after unsaved work is handled, and cleanup of obsolete static caches. Do not force reload during a form edit. Test first load without network (cannot assume a shell was already cached), subsequent offline launches, reconnection, and upgrade from an older cached build.

## Milestones and progress checklist

### 1 — Audit and plan (this task)

- [x] Inspect runtime, source layout, navigation, API boundary, and native dependencies.
- [x] Identify reusable code and browser-specific behavior.
- [x] Record approach, scope, limitations, and milestones.
- [x] Leave implementation unchanged.

### 2 — Browser foundation and compatibility spike

- [x] Select and pin compatible web tooling; add isolated browser entry/build scripts.
- [x] Resolve JSX-in-JS, web extensions, image assets, and native dependency boundaries.
- [x] Mount representative dashboard/list/form routes using the existing theme.
- [x] Add initial URL mapping, safe-area shell, dialog/date adapters needed to exercise the form.
- [x] Verify API CORS using a real browser; document access-policy unknowns. Direct API requests are blocked by missing CORS headers; local proxy verified working.
- [x] Pass dev and production browser builds, direct URL refresh, and existing native tests.
- [x] Verify Android debug build and Metro production bundle after adding web dependencies.
- [ ] Native runtime launch/device regression before expanding the migration (build/bundle checks are complete).

Exit: a browser foundation with working navigation and a representative form, not empty placeholders masquerading as a completed app. If this fails, revise this plan before proceeding.

### 3 — Dashboard and animals

- [ ] Dashboard ranges, totals, and cards; animal active/inactive lists and details.
- [ ] Add/edit animal validation, optional purchase price, imageUrl and photo upload/display.
- [ ] Direct detail/edit URLs, related animal navigation, retry/not-found handling.
- [ ] Verify iPhone-sized layout and upload failure/cancellation; use test records for writes.

### 4 — Production, purchase, and sales

- [ ] All list/add/edit/detail flows, production history/statistics/filters.
- [ ] Existing rate/amount rules, date/shift defaults, and save navigation behavior.
- [ ] Draggable '+ Add' controls and per-screen persistence.
- [ ] Refresh/back/forward on ID-based URLs; date-range boundary and numeric validation checks.

### 5 — Remaining modules

- [ ] Sellers/customers CRUD and billing entry flows.
- [ ] Employees, salaries, and salary transactions.
- [ ] Expense creation/details/images, breeding list/add/edit, vaccine list/add.
- [ ] All More destinations accounted for; Profile/Settings remain explicit placeholders.

This is the largest milestone; split employees/salaries from the other modules into two prompts if needed.

### 6 — PDF delivery, greeting, and browser polish

- [ ] Seller/customer PDF preview, download/open/share, real seal and multipage verification.
- [ ] Greeting playback with user-gesture fallback and successful-playback one-hour cooldown.
- [ ] Finish modal focus, touch/keyboard, responsive widths, safe areas and missing adapters.
- [ ] Verify real iPhone Safari behavior for media/files; record any remaining device limitations.

### 7 — Installability and offline/update handling

- [ ] Manifest, icons, install guidance, static shell caching and offline message.
- [ ] No offline mutations, sensitive-data caches, or misleading save success.
- [ ] Controlled update/reload flow and stale-cache cleanup.
- [ ] Installed standalone mode, offline/reconnect, and older-build upgrade checks.

### 8 — Release verification and deployment

- [ ] Choose host/domain and settle friend access/data scope; configure backend access/CORS as needed.
- [ ] Run existing meaningful tests plus web adapter and browser workflow tests.
- [ ] Check production bundle for native-only imports; verify HTTPS and direct URL hosting rewrites.
- [ ] Regression-test Android launch, forms, photos, PDFs, navigation, and greeting.
- [ ] Real iPhone Safari AND Home Screen testing: keyboard, safe areas, uploads, dates, downloads/share, cooldown, offline and updates.
- [ ] Deploy only the completed, verified release; record URL, rollout/rollback notes and known limitations.

## Working agreement for subsequent prompts

Read this file first, check current git changes, implement only the requested milestone, and update its checklist, changed files, checks, and remaining blockers before ending. Preserve existing native behavior and unrelated edits. Avoid broad dependency upgrades. Maintain the existing green theme and approved '+ Add' design. Do not mark a milestone done because its UI merely compiles. No fixed token/time estimate is claimed; use milestones as resumable work boundaries.

Pending inputs can wait until relevant: friend's iOS version for device testing, same-dairy versus separate-dairy access, and hosting/domain preference. They do not block the foundation spike.

## Verification record

- Source audit only: package declarations, app/navigation modules, API wrapper/config, form routes, photo/date/modal/button components, PDF utilities, and native greeting lifecycle code reviewed.
- No browser build or real-iPhone compatibility verified yet; no runtime tests or native builds were needed for this documentation-only change.
- Deployed API CORS, backend authorization, and hosting behavior remain unverified. Do not treat source assumptions as production evidence.

## Technical references checked for this plan

- [React Native Web installation](https://necolas.github.io/react-native-web/docs/installation/) and [multiplatform setup](https://necolas.github.io/react-native-web/docs/multi-platform/): incremental reuse and bundler considerations.
- [React Navigation web support](https://reactnavigation.org/docs/web-support/) and [link configuration](https://reactnavigation.org/docs/configuring-links/): URL integration and browser navigation semantics.
- [Vite features](https://vite.dev/guide/features.html): browser build tooling; actual dependency compatibility is a milestone-2 gate.
- [WebKit media policies](https://webkit.org/blog/6784/new-video-policies-for-ios/): audio gesture constraints; verify current target iPhone behavior.
- [MDN Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API): HTTPS, user activation, and capability checks.
- [MDN PWA installation](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable) and [offline operation](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation): install metadata and service-worker responsibilities.


## Milestone 2 implementation record — 6 October 2026

### Delivered

- Separate `web/index.html`, `main.jsx`, CSS and Vite config; `web:dev`, `web:build`, `web:preview` scripts. Pinned React DOM 19.2.3, React Native Web 0.21.3, Vite 6.4.4 and React plugin 4.7.0. No existing lockfile dependency versions changed.
- Web root/navigation and a matching six-tab shell, responsive up to 960px, safe-area padding, direct form/list URLs, initial stack routes for back navigation, titles, not-found page and URL serialization that excludes whole objects.
- Existing native-stack works in the browser spike; no replacement stack library was needed.
- Browser date input preserves local date fields and min/max; web Alert uses a native HTML dialog with existing button callbacks. Vite facade isolates this from native Alert.
- Web API environment configuration, optional example environment and a localhost-only development proxy. Native API config is untouched.
- Minimal explicit unavailable adapters keep the native image picker/share libraries out of the bundle. Photo upload work remains milestone 3; PDF file delivery remains milestone 6. Existing screens render but are not certified feature-complete.
- Removed a pre-existing unused `bucketByDay` import from AnimalDetailsScreen: the export did not exist and prevented Vite dependency scanning. No behavior depended on this import.
- Fixed React Native Web animation cleanup's `global` reference with a browser-only `globalThis` build definition.

### Checks and evidence

- `npm run web:build`: PASS; built browser app rendered from the production preview server.
- `npm test -- --runInBand --silent --watchman=false`: PASS, 47 tests in 12 suites (44 existing plus 3 URL tests).
- Android `:app:assembleDebug -PreactNativeArchitectures=arm64-v8a`: PASS.
- Metro Android production JS bundle: PASS; browser-only files do not replace native implementations.
- Focused ESLint: zero errors; 10 style/component warnings. `git diff --check`: PASS.
- Browser checks: dashboard/Production navigation; direct `/production/new` and reload; header Back and browser Back; Add button; Add Production required-field validation with no save; date change; Alert open/dismiss; unknown production-build path; desktop and 390x844 mobile layouts.
- Read-only dev proxy dashboard request returned HTTP 200; the browser visibly rendered the real dashboard totals. No live records were created or modified.
- Production API GET and OPTIONS both returned HTTP 200 without Access-Control-Allow-Origin; the actual production-preview browser dashboard request failed. This is a confirmed deployment blocker, not a frontend build failure.

### Remaining limitations and next step

- Configure backend CORS for the deployment origin or a production same-origin proxy before sharing a hosted build. No backend policy was changed here. Authentication/data isolation still needs verification.
- Stable ID hydration for object-backed details/edits remains in milestones 3–5. Temporary detail/edit URLs do not survive refresh with their record data; list and Add routes do.
- No manifest/service worker/install prompt, greeting, upload processing, or PDF export added in this foundation step.
- Production bundle has a size warning (~825 kB JS / 234 kB gzip); route splitting is a later optimization. RN Web logs deprecation warnings for existing shadow/pointerEvents props.
- Local Node 25.2.1 produces React Native engine warnings; use a supported Node 22.13+ (22.x) or 24.3+ (24.x) for reproducible development.
- Native emulator launch and real iPhone Safari checks are not claimed by the build checks.
- Next: milestone 3 (dashboard/animals plus real web photo uploads), followed by object-backed production/purchase/sales route hydration in milestone 4.

Local run instructions and API behavior: `web/README.md`. The current dev server is http://127.0.0.1:5173; restart with `npm run web:dev` if it stops.
