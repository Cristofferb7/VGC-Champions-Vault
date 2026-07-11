# Sprint 7 — Mobile Home polish (user tested on a real iPhone)

Cowork QA of Sprint 6 on prod (2026-07-11): **pass.** Archetypes tab live with real clusters, provenance line, carry %s, real #1 example teams; analyzer chip verified on-device in the user's recording; all four judgment calls were sound. The user then recorded the app on an iPhone (~390pt viewport, Safari) — Database/Teams/Analyzer look great on the phone, **Home clearly lags.** This sprint is UI-only: make Home as good as the other screens on mobile. User's words: "focus on that before moving on."

Frames from the recording are saved at `outputs/frames/` in the Cowork session; ask if you need them re-shared. Test everything at 390×844 (Chrome device emulation, iPhone 14/15 class) AND desktop 1440 — both must stay clean.

## 1. The "strange separation" above the bottom nav (user's #1 complaint)

On the phone there's a dead black band between the YOUR ROSTERS section and the bottom nav — content ends, then empty space, then nav. Likely a stack of three mobile-viewport issues; check all:

- **`100vh` on iOS Safari** includes the collapsed browser chrome → layout is taller than the visible area. Use `100dvh` (with `100vh` fallback) or `min-h-dvh` for the app frame and any screen-height containers.
- **FAB/nav clearance padding** was tuned on desktop (924px tall). On a 660pt-visible-viewport phone it's disproportionate. Make it exactly `nav height + FAB overlap + env(safe-area-inset-bottom)`, not a fixed desktop constant.
- **Safe-area insets:** add `viewport-fit=cover` to the viewport meta and pad the bottom nav itself with `env(safe-area-inset-bottom)` (home-indicator zone) — required for the installed PWA anyway.

## 2. Roster cards: small and awkward on mobile (user's #2 complaint)

In the recording each card renders six tiny sprites clustered in the top-left with dead space below — the desktop card scaled down instead of a mobile layout:

- Size cards relative to viewport on mobile: ~72vw wide, sprites in a 3×2 grid that actually fills the card (sprite ≥ 48px), name row on top, consistent card height. One card fully visible + a clear peek of the next.
- Scroll-snap to cards; keep the existing kebab menu reachable (44pt target).

**The "weird interaction" (user's #3):** on touch, the carousel fights vertical page scroll and long-press:

- `touch-action: pan-x` on the carousel scroller so vertical swipes starting on it scroll the page, horizontal swipes scroll the carousel — never both.
- Long-press-to-edit must cancel if the pointer moves >10px before the timer fires (currently a scroll attempt can pop the edit menu).
- `-webkit-touch-callout: none` and `user-select: none` on card contents so iOS long-press doesn't trigger the system callout/image-save sheet on sprites.
- Hint text: pointer-coarse devices should say "(Long press to edit)" — verify the pointer-media swap actually works on iOS (the recording shows "Long press" correctly, just confirm after refactor).

## 3. Header on small widths

Title renders as "VGC CHAMPIONS VA…" with the DATA READY pill crowding it. At <420px: collapse the sync pill to its icon + status dot only (full pill in a tooltip/tap), let the title take the row. Alternative: shorten wordmark to "CHAMPIONS VAULT" on mobile. Either way, no truncated ellipsis title on the flagship screen.

## 4. Active team card at 390px

- Type badges wrap inconsistently (Garchomp's stack vertically, others stay inline) — the 3-col grid starves odd columns. Scale badge font/padding down at mobile widths or switch to 2-col grid on <400px so badges never wrap mid-mon.
- The three weakness chips stack vertically right of the W/L row, making the card needlessly tall — on mobile, render chips as one horizontal scrollable row under the W/L line.

## 5. Service-worker update lag (found during QA, not video)

Desktop prod kept serving the previous build on normal navigation; only a hard refresh activated Sprint 6. With `registerType: 'autoUpdate'`, verify the update actually activates: `skipWaiting` + `clientsClaim` in the SW, and the register call should reload once the new SW takes control. A deploy must reach users on their next visit, not whenever they think to hard-refresh. Test: deploy a trivial change, open the site in a normal tab that had the old version, confirm the new build appears within one navigation.

## 6. Regression pass (after the above)

At 390×844 AND 1440×840: Home scroll (no dead band, no clipped cards), roster carousel scroll + long-press menu, sheet open/drag/Escape on both, Database list + detail sheet, Archetypes tab, analyzer matrix horizontal scroll (confirm `touch-action` there too — same gesture-conflict risk as the carousel), OCR entry sheet. Screenshot each in device emulation for the report.

## Explicitly OUT of scope this sprint

No new features, no data work. Community bring/lead collection and the LLM digest stay parked until the user green-lights the next phase. (Sparkline lights up ~Aug 6 on its own.)

## User action items (carried)

- `VERCEL_TOKEN` repo secret (both Actions auto-deploy once set).
- Android share-target on-device test (iPhone recording received — thank you; Android still untested).

## Definition of done

All six sections addressed; device-emulation screenshots of Home at 390×844 before/after in the report; desktop unchanged visually; build passes; deployed; anomalies reported per standing workflow.
