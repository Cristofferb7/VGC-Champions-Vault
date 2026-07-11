# VGC Champions Vault — Matchup Analyzer

**Live: https://champions-analyzer.vercel.app**

Clean Vite + React + TypeScript + Tailwind CSS v4 refactor of the Figma Make
exports in `../VCG-Champions-Vault/`, following `../CHAMPIONS_ANALYZER_BRIEF.md`
and the per-sprint handoff docs. Mobile-first "competitive HUD" web app,
backed by **live Pikalytics data** for the Reg M-B Season 3 format.

> Unofficial fan-made tool. Not affiliated with Nintendo, Creatures,
> GAME FREAK, or The Pokémon Company. Data courtesy of
> [Pikalytics](https://www.pikalytics.com). Free, no ads, no monetization.

## Run it

```bash
npm install
npm run dev
```

Vite prints the local URL (default `http://localhost:5173`).
`npm run build` typechecks and produces `dist/`; `npm run preview` serves it.

> **Data note:** Pikalytics has no CORS headers. Dev and `vite preview`
> traffic goes through the Vite proxy (`/pika` → pikalytics.com, see
> `vite.config.ts`); production uses a Vercel rewrite with CDN caching
> (`vercel.json`, `CDN-Cache-Control: max-age=86400` — Pikalytics updates
> ~monthly, so upstream traffic is negligible). If the fetch fails, the app
> boots from its IndexedDB snapshot with honest Stale/Offline states.

## Deploy

`npx vercel deploy --prod` from the repo root (project: `champions-analyzer`,
framework preset: Vite). `vercel.json` carries the `/pika` rewrite + cache
headers and the SPA fallback — no serverless functions needed.

Lighthouse (prod, 2026-07-11): **Performance 88 · Accessibility 96 ·
Best Practices 96 · SEO 92**.

## Mobile path (decided 2026-07-11)

- **Phase 1 (now):** this Vercel web app + installable PWA. Android installs
  get the OS **share sheet integration** (share a team-preview screenshot →
  app opens with OCR results, offline-capable after first use).
- **Phase 2 (later):** Capacitor 8 wrap of this same `dist/` for the App
  Store, with a native iOS share extension. Prereq already in place: all
  IndexedDB access goes through the single `src/lib/metaCache.ts` module,
  so storage can move to SQLite/Preferences without touching screens.
- **Not doing:** React Native/Expo rewrite — buys nothing for a
  data/calculator app.

## Screens

- **Home** — active team with computed shared-weakness chips (tap to see which
  members and multipliers), rosters carousel (kebab / right-click / long-press
  to duplicate or delete; persisted to IndexedDB).
- **Database** — live Pikalytics usage list (fuzzy search, sort), per-Pokémon
  bottom sheet: spread, moves/items/abilities bars, teammates, defensive
  profile. Snapshot cached in IndexedDB; the header pill reflects real cache
  state (Syncing / Data Ready / Stale / Offline; bell dot = tap to re-sync).
- **Teams** — real recent top teams (author, record, event) parsed from the
  Pikalytics index; tap to clone into the **Team Builder**: 6 slots over the
  cached meta list with live weakness + STAB-coverage analysis; saves as a
  roster.
- **Analyzer** — threat matrix (Good/Bad/Neutral per cell, sticky team column,
  snap scrolling). Opponent entry via the camera FAB or Edit button: manual
  picker, or **screenshot ingestion v1** — drop/paste/pick a clean team-preview
  screenshot, OCR (tesseract.js, lazy-loaded) fuzzy-corrected against the
  format species list, confidence-tinted chips, manual picker as correction
  UI. With a full 6 entered, a **Likely Brings** panel ranks the probable 4
  from usage + teammate co-occurrence (labeled as a prior, not real bring
  rates). Cell tap: type math, `@smogon/calc` damage ranges from top-usage
  moves & spreads (labeled Gen 9 approximation), and level-50 speed tiers.
  Lead likelihood is intentionally absent — the API exposes no lead stats;
  never faked.
- **Share/export** — active-team share button renders a team-sheet PNG
  (canvas; Web Share on mobile, download on desktop); Showdown-paste export
  from the team card and each roster's menu.
- **PWA** — installable (vite-plugin-pwa), offline app shell + IndexedDB
  snapshot, so it works at events without signal.

## Architecture

UI is isolated from logic: components render props; hooks own state and
calculation; `lib/` is pure functions; `data/` is config-driven content.

```
src/
├── config.ts       FORMAT_CODE + API base — regulation churn touches only this
├── types/          Domain types
├── data/           Type chart, type colors, species lexicon, seed teams
├── lib/            pikalytics (fetch+parse), metaCache (IndexedDB), damage
│                   (@smogon/calc + speed tiers), matchup, teamAnalysis, fuzzy
├── hooks/          useMetaData (context: snapshot + sync status),
│                   usePokemonDetail, useUsageSearch, useMatchupAnalysis,
│                   useTeamBuilder, useRosters (IndexedDB-persisted),
│                   useMetaTeams, useActiveTeam, useNavigation, useLongPress,
│                   useScrollEdges
└── app/
    ├── App.tsx     Provider + shell (directional screen transitions)
    ├── screens/    One per bottom-nav tab
    └── components/ layout/ shared/ home/ teams/ database/ analyzer/
```

## Data honesty rules (enforced in code)

- Percentages the source omits render as "—", never invented (usage % is N/A
  in this format; teammate %s are broken upstream → names only).
- All inference is labeled "usage-based likelihood" with raw %s beside claims.
- Damage numbers are labeled Gen 9 approximations until the Champions data
  layer is vendored.
- Attribution: "Data: Pikalytics" + standard unofficial disclaimer in the
  Database footer (required by their API docs).

## Notes

- Sprites load from PokeAPI's GitHub CDN; Mega forms fall back to base-form
  sprites (team preview shows base forms per the brief). Swap for original
  icons before any store release (IP rules in the brief).
- Node 20.17 compatible (Vite pinned to 6.x).
