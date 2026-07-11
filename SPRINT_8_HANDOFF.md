# Sprint 8 — Capacitor Android wrap (real APK, done right)

Cowork QA of Sprint 7 (2026-07-11): **pass** at reproducible sizes — roster cards rebuilt correctly (filled 3×2 grid, card+peek, kebab), weakness chips one row, clearance proportionate, SW hot-swap confirmed. Sub-420px specifics + iOS dvh await the user's iPhone re-check (correctly flagged in your report).

Context: the user tried to follow third-party **Expo** instructions (app.json config plugin, `expo run:android`). This project has no Expo and never will per the decided mobile plan — the native path is **Capacitor 8**. This sprint delivers a real Android APK with near-zero user effort, keeping the web/PWA deploy completely unaffected.

## 1. Capacitor scaffold

- `@capacitor/core` + `@capacitor/cli` + `@capacitor/android`, `capacitor.config.ts` with `webDir: 'dist'`, appId `com.cristoffer.championsvault` (confirm with user if he wants different), appName "Champions Vault".
- Bundle the web app INTO the APK (default) — no server.url pointing at vercel; the app must work offline like the PWA. The existing IndexedDB + snapshot fetches work in the Android WebView; API calls go direct to the vercel URL (absolute base for `/pika` and snapshots when `Capacitor.isNativePlatform()`).
- Keep `dist` building exactly as today; `npx cap sync android` copies it. Add npm scripts: `android:sync`, `android:run`.
- The `android/` folder is generated native code — commit it (Capacitor convention) but exclude build outputs via the generated .gitignore.

## 2. Share intent (the whole point)

The PWA share_target works in installed-PWA context; the APK needs the native equivalent:
- Add a share intent filter for `image/*` via the Capacitor send-intent community plugin (`capacitor-plugin-send-intent` or Capawesome's share-target equivalent — pick the best-maintained for Cap 8) so "Champions Vault" appears in the Android share sheet for screenshots.
- On intent receipt: read the shared image → feed the exact same OCR entry flow the share_target SW path uses (park in Cache Storage or pass a data URL — reuse, don't fork, the existing `share-landing → Analyzer → OCR` code path).

## 3. Storage safety

- Rosters/settings currently live in IndexedDB. In WebView it persists, but wire the existing single storage module to detect native platform and mirror roster writes to Capacitor Preferences as backup (restore path on boot if IndexedDB is empty). Meta snapshot cache stays IndexedDB-only (re-fetchable, no backup needed).

## 4. CI APK build (so the user never opens Android Studio)

- GitHub Action (manual `workflow_dispatch` + on release tag): set up Java 17 + Android SDK, `npm ci && npm run build && npx cap sync android && cd android && ./gradlew assembleDebug`, upload `app-debug.apk` as a workflow artifact.
- Debug APK is fine for personal-device testing (installable with "install unknown apps" permission). Document a `keytool` + signed-release path in the README for later Play Store use, but do NOT generate keys in CI.
- Verify the Action runs green and produces a downloadable artifact.

## 5. User-facing instructions (write these into README, replacing any Expo confusion)

Path A (no cable, recommended): Actions tab → "Android APK" workflow → latest run → download `app-debug.apk` → copy to phone → tap to install.
Path B (cable): enable Developer Options + USB debugging → `npm run android:run` (requires local Android Studio/SDK — optional, not the default path).

## 6. Regression guard

- Web build/deploy unchanged: Vercel build must not attempt anything Capacitor-related; `cap sync` never runs in the Vercel pipeline.
- PWA still installs and share_target still works on Android Chrome (the APK and PWA coexist; document that testing both on one device shows two share-sheet entries).
- Bundle size sanity: tesseract LSTM cores are runtime-cached, not bundled — confirm the APK doesn't balloon past ~30 MB; if the plugin setup pulls them in, exclude.

## Out of scope

iOS (needs a Mac signing setup + Apple dev account — separate sprint when the user wants it). Play Store submission (needs the IP-hygiene sprite decision from SPRINT_4 §2 resolved first — note this in README).

## User action items

- iPhone re-check of Home (dead band gone? header complete? carousel feel?) — from Sprint 7.
- After this sprint: download the APK artifact and test the share sheet on Android.
- Confirm or override the appId (`com.cristoffer.championsvault`).

## Definition of done

APK artifact downloadable from a green Action run; share-sheet intent opens the app into OCR with a shared screenshot (verified in an emulator in CI is acceptable; document if emulator-untestable); web deploy provably unaffected (fresh prod smoke test); README's mobile section rewritten around Paths A/B; anomalies reported per standing workflow.
