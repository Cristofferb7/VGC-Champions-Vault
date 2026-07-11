# VGC Champions Vault (champions-analyzer)

Vite 6 + React 18 + TypeScript + Tailwind 4 + motion. Mobile-first "competitive HUD" for Pokémon Champions (Reg M-B S3). Live Pikalytics data via `/pika` proxy, IndexedDB snapshot cache, @smogon/calc on-device. See README.md for full feature map and CHAMPIONS_ANALYZER_BRIEF.md (in parent folder) for product vision.

## ➤ CURRENT ASSIGNMENT

**Read `SPRINT_8_HANDOFF.md` and work through it top to bottom.** (Sprint 7 mobile-Home polish passed QA. Sprint 8 = Capacitor 8 Android wrap: APK via CI artifact, native share intent reusing the OCR flow, storage backup, web deploy untouched. The user does NOT use Expo — ignore any app.json/expo instructions he may mention; Capacitor is the decided path.)

## Standing workflow (do not change)

1. Cowork (Claude desktop) QA-tests each sprint live in the browser and writes the next handoff MD into this repo root (`NEXT_SPRINT_INSTRUCTIONS.md` → `QA_ROUND_2.md` → `SPRINT_4_HANDOFF.md` → ...).
2. This CLAUDE.md's "CURRENT ASSIGNMENT" line always points at the newest handoff doc. Start there each session.
3. Commit per section (bugs separate from features) so QA can diff and verify each round.
4. Honesty rules from the brief are non-negotiable: label everything "usage-based likelihood", show raw %, never fake data the API doesn't have (e.g. lead stats).
5. When a sprint is done, summarize what was done + any unresolved anomalies at the top of your final report — Cowork QA reads it before testing. Never leave an investigation ("checking IndexedDB...") unreported.

## Conventions

- Screens in `src/app/screens/`, shared components in `src/app/components/shared/`, data access in `src/lib/` + `src/hooks/`.
- Format code and API paths live in `src/config.ts` — never hardcode elsewhere (Season 4 rollover: Sept 2, 2026).
- All storage goes through the IndexedDB layer; don't scatter direct `indexedDB` calls (Capacitor migration planned).
- `npm run build` must pass (tsc + vite) before any commit.
