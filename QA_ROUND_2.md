# QA Round 2 — findings from live review (2026-07-10, post-sprint)

Everything in NEXT_SPRINT_INSTRUCTIONS.md verified working. New issues found while testing, ordered by priority.

## 1. Bottom sheet interaction friction (worst issue — hit it repeatedly)

- The X close button misses on first click more often than it hits (likely small hitbox + the sheet still settling from its spring animation). Give it a ≥44px hit area and don't attach the handler until the open animation completes, or debounce position.
- While a sheet is open it covers the bottom nav, so tapping a nav tab does nothing (or just dismisses). Twice I needed 2–3 taps to get from an open sheet to another tab. Fix: nav tap while a sheet is open should dismiss the sheet AND navigate in one gesture.
- Add swipe-down-to-dismiss on the drag handle (it renders a handle but doesn't respond to drag).

## 2. Top Teams parser artifacts (visible data corruption on a flagship screen)

- Team #7 "DaniVGC03 · Maddo's Cup #9 \" — title has a trailing stray backslash, and the team renders a single orb labeled "100" with no sprites. A non-species token is being parsed as a Pokémon.
- Team #9 renders an unresolved orb labeled "TOX" — species name truncated/unmapped (Toxtricity form? regional form?).
- Fix: normalize species names (forms, hyphens, regional variants) against the snapshot's species list before rendering; drop tokens that don't resolve; if a name resolves but has no sprite, show full name in the orb tooltip. Strip trailing punctuation from tournament titles. Skip or flag teams with <6 resolved members rather than rendering broken orbs.

## 3. Sprint-log loose end: roster seed/save reconciliation

Your own sprint log noted "carousel shows JOEUX9 CLONE first with seed teams seemingly missing — checking IndexedDB" and never reported the resolution. Today the carousel shows TEAM 1/2/3 + NEW TEAM and no clone. Confirm: (a) what the reconciliation logic is (seeds only on first launch?), (b) that a saved clone reliably appears at the correct position and survives reload, (c) that deleting all rosters doesn't re-seed on next boot. Add whatever was learned to a comment in useRosters.

## 4. Threat matrix initial render

First opponent column (Charizard) renders partially clipped under the sticky left column / left fade on first load, before any scrolling. Initial scrollLeft should be 0 with the left fade hidden until the user scrolls.

## 5. Screen-transition click leak

During directional screen transitions both screens render briefly; a tap during the animation can land on the outgoing screen (I got a Home/list hybrid state mid-transition). Set `pointer-events: none` on the outgoing screen for the duration.

## 6. Consistency nit

Home seed rosters (TEAM 1/2/3) are still Gen-1-flavored (Blastoise/Venusaur/Charizard/Pikachu/Lapras/Dragonite). Top Teams got real Reg M-B data — reseed the default rosters from real archetypes too (e.g. derive from top teammates data), or name them something self-aware like "Sample team".

## Suggested next features (after the above, in order)

1. **Screenshot ingestion v1** — the brief's killer UX. Start with clean Switch-16:9 team preview screenshots: file drop / paste on desktop, template-match the six name plates, OCR via tesseract.js against the species list for fuzzy correction. Manual picker already exists as the correction UI when confidence is low.
2. **Bring/lead likelihood panel** on the Analyzer once a 6-mon opponent team is entered: rank which 4 they most likely bring vs your team, from usage + teammate correlations. Label with raw %.
3. **Share/export**: active team card's share button → rendered team-sheet image (canvas) for Discord; export roster as Showdown paste.
4. **PWA wrapper** (manifest + service worker caching the snapshot) so it installs on phone and works offline at events — big portfolio talking point.
