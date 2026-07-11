# VGC Champions Vault — Matchup Analyzer

Clean Vite + React + TypeScript + Tailwind CSS v4 refactor of the Figma Make
exports in `../VCG-Champions-Vault/`, following `../CHAMPIONS_ANALYZER_BRIEF.md`
and `NEXT_SPRINT_INSTRUCTIONS.md`. Mobile-first "competitive HUD" web app,
now backed by **live Pikalytics data** for the Reg M-B Season 3 format.

## Run it

```bash
npm install
npm run dev
```

Vite prints the local URL (default `http://localhost:5173`).
`npm run build` typechecks and produces `dist/`; `npm run preview` serves it.

> **Data note:** Pikalytics has no CORS headers, so dev traffic goes through
> the Vite proxy (`/pika` → pikalytics.com, see `vite.config.ts`). A static
> production deploy won't reach the API — the app then boots from its
> IndexedDB snapshot and shows honest Stale/Offline states. A real backend
> replaces the proxy in a later sprint.

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
  snap scrolling). Opponent entry via the camera FAB or Edit button (manual
  picker; screenshot recognition deferred per brief). Cell tap: type math,
  `@smogon/calc` damage ranges from top-usage moves & spreads (labeled Gen 9
  approximation), and level-50 speed tiers. Lead likelihood is intentionally
  absent — the API exposes no lead stats; never faked.

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
