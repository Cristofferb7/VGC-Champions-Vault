# Research: becoming a Pikalytics-style data platform (not just a consumer)

Researched 2026-07-11 by Cowork. Question: how do sites like Pikalytics / pokemon-zone / Pokébase collect and showcase data, and where do LLMs / ML actually fit?

## TL;DR

These sites are not ML products and don't "deploy an LLM" to get data. They are **aggregation pipelines**: scheduled jobs pull from a handful of well-known sources → normalize into a database → compute percentages → serve charts. You already consume the output of one such pipeline (Pikalytics AI API). Becoming a *source* means running your own ingest jobs — and for Champions specifically, there's one genuinely novel dataset you can collect that nobody else has (see §4). ML earns its place in three narrow spots (§5); an LLM is only useful as a presentation layer, never for collection.

## 1. Where the data actually comes from (all of it)

| Source | What it has | Access | Cost/risk |
|---|---|---|---|
| **Pokémon HOME Battle Data** | Official cartridge/Champions ranked usage (mons, moves, items, abilities) | Mobile-app only; private undocumented API. This is where "official in-game data" on these sites ultimately originates | ToS gray zone — do NOT hit it directly; consume via Pikalytics's deliberately open AI API with attribution (current approach ✓) |
| **Smogon/Showdown monthly stats** | Usage, moves/items/spreads distributions, teammates, Checks & Counters — the `chaos/*.json` files, incl. `gen9championsvgc2026regmb` | Fully public, documented, monthly at smogon.com/stats | Free, zero risk. Parsers exist: `pkmn/stats`, `@pkmn/smogon` (data.pkmn.cc serves pre-converted optimized JSON) |
| **Showdown replays** | Full battle logs — real leads, brings, turn-by-turn, per-battle win/loss | Public: any replay URL + `.json` returns structured log; search endpoints documented in `pokemon-showdown-client/WEB-API.md`; `Access-Control-Allow-Origin: *` | Free. Ready-made corpora exist on Hugging Face (metamon-parsed-replays; HolidayOugi's 2005–2026 dumps) |
| **Limitless** | Tournament placings, matches, and **complete joint team sheets** from open-team-sheet VGC events | Real documented API (docs.limitlesstcg.com/developer.html); most endpoints keyless, `/decks` needs a free API-key application; webhooks for finished tournaments; Python wrapper `limitless-python` | Free, sanctioned |
| **PokeAPI** | Static species/move/type data | Public REST | Free (already effectively covered by your typeChart/species data) |

Key limitation to be honest about: **Champions is a cartridge/mobile game — there are no public replays of ladder games.** Turn-level Champions data does not exist anywhere public. Showdown replays cover Showdown's *recreation* of the format (`gen9championsvgc2026regmb`), which is a related-but-different population.

## 2. Reference pipeline (what Pikalytics-the-company runs, sized for us)

```
node-cron worker (or Vercel Cron)
 ├─ daily:   Pikalytics AI API  → per-species builds        (already have the parser)
 ├─ monthly: Smogon chaos JSON  → spreads, C&C, teammates   (~3 MB gz per format)
 ├─ weekly:  Limitless API      → tournament team sheets
 └─ opt-in:  our own users      → OCR'd opponent teams + reported W/L  (§4)
        ↓ normalize to one schema
 Postgres (Supabase/Neon free tier) — raw tables + materialized aggregates
        ↓ nightly export
 static JSON snapshot per format  →  the app (existing IndexedDB flow unchanged)
 GET /api/meta/:format[/:species] (ETag)  →  future consumers / portfolio API
```

This matches the architecture already sketched in CHAMPIONS_ANALYZER_BRIEF.md. Everything fits free tiers at portfolio scale. The app doesn't change — only where the snapshot comes from.

## 3. "Showcase" layer (what makes Pikalytics feel like Pikalytics)

Percentages with denominators shown, monthly snapshot navigation (time-travel: "Garchomp usage over seasons" — you get this for free by never deleting old snapshots), rank-cutoff segmentation (top-ladder vs all-ladder — Smogon publishes both weighted baselines, e.g. `-1760`), and per-species pages that are shareable URLs. Recommendation: add snapshot **history** to the ingest from day one; trend charts are the cheapest impressive feature and no competitor of your size has them.

## 4. The novel dataset only this app can collect (the real differentiator)

Bring rates and lead rates for cartridge Champions are **hidden from every public source** (HOME doesn't publish them; no replays exist). But this app literally OCRs opponent team previews and could let the user tap what the opponent actually brought/led + result afterward. Aggregated (opt-in, anonymous), that's crowdsourced bring/lead/win data for the cartridge ladder — the exact data the "Likely Brings" panel currently has to approximate from teammate priors. Nobody has this. Even a few hundred submissions beats a prior. Requirements: explicit opt-in toggle, anonymous device ID only, a moderation/outlier filter, and a "community data (n=X)" label everywhere it surfaces.

## 5. Where ML/LLMs actually fit (practical ladder, in order)

1. **No ML (now):** counting and percentages. This is 90% of what these sites are. Don't overbuild.
2. **Classic ML (v2, cheap, runs in a script or even in-browser):**
   - *Archetype clustering* — k-means/HDBSCAN over teammate co-occurrence vectors from chaos data + Limitless sheets → named archetypes ("Rain", "Trick Room") with usage share. Sklearn script, runs in minutes, huge showcase value.
   - *Lead prediction* — a July 2025 peer-reviewed(ish) study (Journal of Geek Studies) used Latent Semantic Analysis over ~5,000 Showdown logs to predict VGC lead pairs and validated against NAIC 2025 top cut. Fully reproducible approach with the replay corpora above.
   - *Set inference* — foul-play's approach: maintain candidate full sets per species, filter/renormalize as info is revealed (already the brief's v3 ambition). Bayesian counting, not deep learning.
3. **Deep RL (research-grade, skip):** Metamon (offline RL over ~3.5M replays), VGC-Bench, the PokeAgent Challenge — this is what "an ML Pokémon project" looks like academically. Only relevant if you ever want a battle-bot; not needed for a stats product.
4. **LLMs (presentation only, v3):** an LLM cannot collect data. Legit uses: (a) natural-language matchup digest — "vs this team: lead X, watch out for Y" generated from YOUR computed numbers (small API call, cents); (b) a RAG chat over your snapshot ("what beats Kingambit on a budget?"); (c) OCR post-correction. All are API calls (Haiku-class model), no self-hosting/deploying needed. Rule from the brief still applies: LLM text must cite the raw % it was given, never invent numbers.

## 6. Legal / etiquette summary

Smogon stats + Showdown replays: public, intended for this. Limitless: documented API, apply for key. Pikalytics AI API: deliberately open, attribution required (already shipped). Pokémon HOME private API: don't touch directly. Don't scrape pokemon-zone/game8/op.gg (no API, ToS). Community-collected data: opt-in + anonymous + labeled. Keep the whole thing free.

## 7. Suggested roadmap (post-Sprint-4)

- **v1.5 — Smogon chaos ingest** (1 sprint): monthly job (can even run client-side or as a GitHub Action committing snapshots to the repo — zero backend), unlocks real spread *distributions* and Checks & Counters for the threat matrix. Add snapshot history + a usage-trend sparkline per species.
- **v2 — Limitless ingest + archetype clustering** (1–2 sprints): real joint team sheets → clustered archetypes → "this opponent's team is 78% similar to Rain archetype" in the analyzer. First genuinely ML-powered feature, still just sklearn.
- **v2.5 — Community bring/lead collection** (§4) once there are real users. This is the moat.
- **v3 — LLM matchup digest / coach chat** as a polish layer over everything above.

## Sources

- [Smogon usage stats discussion (chaos JSON docs)](https://www.smogon.com/forums/threads/gen-9-smogon-university-usage-statistics-discussion-thread.3711767/) · [pkmn/smogon + data.pkmn.cc](https://github.com/pkmn/smogon) · [GriffinLedingham/smogon-usage-parser](https://github.com/GriffinLedingham/smogon-usage-parser)
- [Showdown Web API (replay .json endpoints)](https://github.com/smogon/pokemon-showdown-client/blob/master/WEB-API.md) · [metamon-parsed-replays dataset](https://huggingface.co/datasets/jakegrigsby/metamon-parsed-replays) · [HolidayOugi replay dumps](https://huggingface.co/datasets/HolidayOugi/pokemon-showdown-replays) · [Kaggle gen9 randbats logs](https://www.kaggle.com/datasets/thephilliplin/pokemon-showdown-battles-gen9-randbats)
- [Limitless developer docs](https://docs.limitlesstcg.com/developer.html) · [limitless-python wrapper](https://github.com/jpbullalayao/limitless-python) · [Limitless VGC database](https://limitlessvgc.com/)
- [Pokémon HOME Battle Data feature (official)](https://support.pokemon.com/hc/en-us/articles/360043472332-What-is-the-Battle-Data-feature-in-Pok%C3%A9mon-HOME) · [Pikalytics AI API](https://www.pikalytics.com/llms-full.txt)
- [Foul Play set-inference writeup](https://pmariglia.github.io/posts/foul-play/) · [VGC lead prediction via LSA (Jul 2025)](https://jgeekstudies.org/2025/07/11/predicting-competitive-pokemon-vgc-leads-using-latent-semantic-analysis-a-data-driven-approach-to-team-matchups/) · [Metamon: offline RL over replays](https://arxiv.org/html/2504.04395v1) · [VGC-Bench](https://arxiv.org/pdf/2506.10326) · [PokeAgent Challenge](https://arxiv.org/html/2603.15563v2) · [pkmn.ai project index](https://pkmn.ai/projects/)
