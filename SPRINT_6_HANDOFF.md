# Sprint 6 — Archetype intelligence (Limitless ingest + clustering)

Cowork QA of Sprint 5 on prod (2026-07-11): **all pass.** Mouse drag-dismiss works (no text selection), Escape closes, spread distributions render in Champions 0–32 values with "Showdown · Jun 2026 · tier" labels, C&C shows real KO/switch rates with sample sizes, matrix evidence dots present and the cell sheet's explanation is excellent ("...56.6% of 249 weighted encounters — this verdict comes from real games, not the type chart"). Snapshot serving confirmed. The three declared anomalies are all reasonable.

## 1. Small fixes from QA (do first, quick)

- **Tier toggle pill is clipped** in the Database filter row ("SD ALL L…" cut off at the right edge). Make the pill row horizontally scrollable with the same edge-fade treatment as the matrix, or shorten labels to "ALL LADDER / TOP LADDER".
- **C&C evidence gate is loose at n≥20.** The Gardevoir↔Kingambit override rests on n=249 (fine), but n=20 verdicts would be noise. Raise the matrix-override gate to n≥100 (keep n≥20 for merely *displaying* C&C in the Database sheet, with the n visible). Document the two thresholds in code.
- **QA couldn't sight the lead-usage section** in the Database sheet during testing — confirm where it renders (it may only appear for common leads) and make sure species with no lead data show nothing rather than an empty header.

## 2. Headline: Limitless tournament ingest + archetype clustering (research doc §7 v2)

The Smogon layer gives marginals; Limitless gives **complete joint team sheets** from real tournaments — the raw material for archetypes. This is the app's first ML feature; keep it sklearn-simple and honest.

**Ingest (extend the existing GitHub Action pattern):**
- Limitless API (docs.limitlesstcg.com/developer.html): pull completed VGC/Champions tournaments for the current regulation — placings + team lists. Most endpoints are keyless; if team-sheet detail requires the `/decks`-style key, apply for one (free) and fall back gracefully until granted (parse what the keyless endpoints expose; the existing Top Teams parser already proves team data is reachable).
- Weekly cadence (tournaments finish on weekends → run Mondays). Same trim-and-commit pattern: `public/snapshots/limitless/YYYY-WW.json`. Cumulative per regulation, not per week — append new tournaments to the regulation file.
- Store per team: 6 species (+ items/moves if available), placing, record, event, date. Normalize species through the existing resolver from the Top Teams fix.

**Clustering (in the build script, NOT in the browser):**
- Feature vector per team: multi-hot species vector (optionally weighted by placing). Cluster with HDBSCAN (or k-means with silhouette-selected k as fallback) in the Node script — use a plain JS implementation, no Python dependency in CI.
- Auto-name clusters from their most-distinctive species (highest lift vs global usage): "Rain (Pelipper core)", "Trick Room (Farigiraf core)". Keep an "Other" bucket; do not force-fit outliers.
- Ship to the snapshot: cluster id, name, member species with in-cluster frequency, share of tournament teams, average placing percentile, and 2–3 example teams (author + event, real ones).

**Surface it:**
- Teams screen, new "Archetypes" tab alongside Top Teams / Team Builder: cluster cards (name, share %, top-6 core sprites, example teams, "Clone core & edit" → builder).
- Analyzer: with 6 opponents entered, cosine-similarity against cluster centroids → "Closest archetype: Rain — 78% similarity" chip above the Likely Brings panel, with the matched core highlighted. Label: "tournament data · Limitless · n=X teams". Below the similarity threshold (<50%), say "No clear archetype match" — never force it.
- Likely Brings: when an archetype matches confidently, blend that cluster's species co-occurrence into the prior (document the blend weight; label unchanged).

## 3. Housekeeping

- Attribution footer: add Limitless alongside Pikalytics/Smogon.
- README: document the second Action, snapshot layout, clustering method (one honest paragraph: features, algorithm, naming heuristic, limitations).
- Keep the sparkline dormant-until-2-months behavior; 2026-07 stats (~Aug 6) will light it up automatically — verify the Action's schedule handles it without intervention.

## User action items (unchanged + one new)

- Add `VERCEL_TOKEN` repo secret so snapshot commits auto-deploy.
- Android on-device share-target test (still untested on real hardware).
- If the Limitless `/decks` key application needs an account email, Claude Code will flag it — approve/register when asked.

## Definition of done

QA fixes in; weekly Limitless Action merged with ≥1 committed snapshot; Archetypes tab live with real clusters from real tournament data; analyzer archetype chip working with honest labels and a working "no match" path; build passes; deployed; anomalies reported per standing workflow.
