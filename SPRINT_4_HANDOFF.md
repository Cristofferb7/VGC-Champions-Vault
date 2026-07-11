# Sprint 4 — Verify round 3, ship to Vercel, prep mobile

Written by Cowork (QA/planning) 2026-07-11. Rounds 1–2 were verified live in the browser. Round 3 (commit `1193fd3`: QA fixes + OCR, bring likelihood, share/export, PWA) is committed but NOT yet visually verified — the dev server was down. That's step 0.

## 0. Verify round 3 in the browser (do this first, report results)

Run `npm run dev` and check each item, since none of this has been QA'd live yet:

- [ ] Bottom sheet: X closes on FIRST click; nav tap while a sheet is open dismisses AND navigates; swipe-down on handle dismisses.
- [ ] Top Teams: the "100"-orb team (DaniVGC03) and "TOX"-orb team (ScarletSkil) render correctly or are filtered; no trailing `\` in titles.
- [ ] Threat matrix first column not clipped on initial render.
- [ ] Screenshot ingestion: drop AND paste AND file-pick a real Champions team-preview screenshot; confirm OCR species chips + confidence tinting + manual correction path. Test a deliberately bad image (photo of a screen) — should fail gracefully into the manual picker.
- [ ] Likely Brings panel appears only with 6 opponents entered; percentages labeled as prior.
- [ ] Share PNG renders correctly; Showdown paste imports cleanly into an actual Showdown teambuilder.
- [ ] Roster seed/save reconciliation (QA_ROUND_2 item 3) — state the answer explicitly this time.
- [ ] `npm run build && npm run preview` — verify PWA installs, offline boot from IndexedDB works with honest Stale/Offline pill.

## 1. Deploy to Vercel (this sprint's headline)

Decision (researched 2026-07-11): launch the web app on Vercel FIRST to test with real users, keep the PWA as the Android install story, add Capacitor later for iOS. No Expo rewrite — nothing about this app needs it.

**No serverless function needed.** Vercel rewrites proxy to external origins server-side, mirroring the existing Vite dev proxy:

```json
// vercel.json
{
  "rewrites": [
    { "source": "/pika/:path*", "destination": "https://www.pikalytics.com/:path*" }
  ],
  "headers": [
    {
      "source": "/pika/:path*",
      "headers": [
        { "key": "CDN-Cache-Control", "value": "max-age=86400, stale-while-revalidate=604800" }
      ]
    }
  ]
}
```

- Projects created after 2026-04-06 have external-rewrite CDN caching on by default; the header above makes the daily cache explicit. Pikalytics updates roughly monthly, so cached hits make upstream traffic negligible.
- Also add SPA fallback if not using file-based routing: `{ "source": "/((?!pika|assets).*)", "destination": "/index.html" }` (adjust to actual asset paths).
- Code change: the fetch base path `/pika` already matches — just make sure nothing is gated on `import.meta.env.DEV`. Remove/soften the "static deploy runs cache-only" fallback since prod now has live data; keep it as the error path.
- Vercel Hobby is fine for this (100 GB bandwidth, 1M invocations — rewrites w/ cache hits barely count) but is **non-commercial only**: keep the app free.
- Deploy flow: push repo to GitHub, import in Vercel dashboard (framework preset: Vite). Set up a preview deployment per PR — good portfolio hygiene.
- After deploy, run Lighthouse on the prod URL; record scores in README.

## 2. IP-risk hygiene (do before the URL is public)

Researched: Nintendo/TPC enforcement targets fan games and asset reproduction, not stat/companion apps — but reduce surface anyway:

- App name/branding: "VGC Champions Vault" is okay-ish, but keep "Pokémon" out of the title/domain/store name. Icon must be original (no Poké Ball motifs).
- The unofficial-disclaimer footer already exists — also add it to the README and any share-PNG output.
- Sprites are copyrighted game assets. Acceptable risk for a free portfolio web demo; for app-store submission later, plan original silhouette/typographic mon representations or make sprites opt-in-loaded, not bundled.
- Keep it 100% free, no ads, no monetization (also required by Vercel Hobby).

## 3. PWA hardening (Android install story)

- Add `share_target` to the manifest (POST, multipart, images) so the installed PWA can RECEIVE shared screenshots on Android — this is the killer UX from the brief and works on Android today. (iOS Safari still doesn't support share_target as of 2026 — that's what Capacitor is for later.)
- Real icons: 192/512 PNG + maskable, not just SVG. Generate from an original design.
- Self-host tesseract.js assets (workerPath/corePath/langPath) and precache them in the service worker, so OCR works offline and doesn't pull ~15 MB from jsDelivr on first use. Keep the dynamic `import('tesseract.js')` so it stays off the main bundle.
- iOS home-screen installs since Safari 17 get persistent storage — call `navigator.storage.persist()` on boot and surface the result in the sync pill's tooltip.

## 4. Mobile app path (documented decision, later sprint)

- **Phase 1 (now):** Vercel web + PWA. Android users can install + share screenshots into it.
- **Phase 2:** Capacitor 8 wrap of this same codebase for App Store/Play Store — `webDir: dist`, plus a native iOS Share Extension (Capawesome Share Target plugin or send-intent) to appear in the iOS share sheet. Prereq: abstract the storage layer (one module wrapping IndexedDB) so user data (rosters) can move to SQLite/Preferences inside Capacitor, where WKWebView can evict IndexedDB.
- **Not doing:** React Native/Expo rewrite — adds a full UI rewrite, still needs the same native share extension, buys nothing for a data/calculator app.
- This sprint's only Phase-2 prep: create `src/lib/storage.ts` as the single IndexedDB access point if not already structured that way.

## 5. Carry-over polish (only if time remains)

- Home seed rosters are still Gen-1 flavored — reseed from real Reg M-B archetypes or label "Sample team".
- Screen-transition click leak: `pointer-events: none` on the outgoing screen during transitions.
- Desktop ambient frame: verify it looks intentional at 1440p and ultrawide.

## Definition of done

Step 0 checklist reported with pass/fail per item; app live on a vercel.app URL with working live data through the rewrite; share_target in manifest verified on an Android device or emulator (or documented as untestable); README updated with the prod URL, deploy instructions, and Lighthouse scores; all committed.
