#!/usr/bin/env node
/**
 * Build a trimmed monthly Smogon snapshot for the app (sprint 5 item 2).
 *
 * Downloads the chaos JSON (cutoffs 0 = "all ladder" and 1760 = "top
 * ladder") plus the leads report for FORMAT, trims to only the fields the
 * app renders, and writes public/snapshots/smogon/YYYY-MM.json (+ updates
 * index.json). Run by .github/workflows/smogon-snapshot.yml monthly, or
 * manually: node scripts/build-smogon-snapshot.mjs [YYYY-MM]
 *
 * Honesty rules (CHAMPIONS_ANALYZER_BRIEF):
 * - Move %s are "% of 4 slots" (sum ≈ 400) — never renormalized to 100.
 * - Checks & Counters keeps n / p / d so the UI can show real KO-or-switch
 *   rates with sample sizes; score = p − 4d (Smogon's own ranking).
 * - Every number is labeled Showdown-ladder at render time, not cartridge.
 */
import { gunzipSync } from "node:zlib";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const FORMAT = "gen9championsvgc2026regmb";
const CUTOFFS = { all: 0, top: 1760 };
const MIN_USAGE = 0.005; // drop sub-0.5% species
const MIN_CC_N = 20; // C&C rows below this sample size are noise

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "snapshots", "smogon");

function defaultMonth() {
  // Stats for month M land ~5th of M+1; default to last month.
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() - 1);
  return d.toISOString().slice(0, 7);
}

const month = process.argv[2] ?? defaultMonth();
if (!/^\d{4}-\d{2}$/.test(month)) {
  console.error(`Bad month "${month}" — expected YYYY-MM`);
  process.exit(1);
}

async function fetchOk(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res;
}

const pct = (x) => Math.round(x * 1000) / 10; // 0.34293 → 34.3

/** Top-N of a weighted-count record as [{name, pct}] against `total`. */
function topShares(record, total, limit, scale = 100) {
  return Object.entries(record)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([name, count]) => ({ name, pct: pct((count / total) * (scale / 100)) }))
    .filter((entry) => entry.pct > 0);
}

function trimSpecies(raw) {
  const movesTotal = Object.values(raw.Moves).reduce((a, b) => a + b, 0);
  const itemsTotal = Object.values(raw.Items).reduce((a, b) => a + b, 0);
  const abilitiesTotal = Object.values(raw.Abilities).reduce((a, b) => a + b, 0);
  const spreadsTotal = Object.values(raw.Spreads).reduce((a, b) => a + b, 0);
  const teammatesTotal = Object.values(raw.Teammates).reduce((a, b) => a + b, 0);

  // Genuine checks only: Smogon's own rating is p − 4d; entries at or
  // below zero mean "does not reliably beat this species" — omitting them
  // is the honest read (some top species legitimately have zero).
  const counters = Object.entries(raw["Checks and Counters"])
    .filter(([, v]) => v.n >= MIN_CC_N && v.p - 4 * v.d > 0)
    .map(([name, v]) => ({
      name,
      n: Math.round(v.n),
      // p = P(this species gets KOed or switched out vs `name`)
      p: pct(v.p),
      score: pct(v.p - 4 * v.d),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return {
    usage: pct(raw.usage),
    // Moves scale to ~400 (4 slots, sampled without replacement upstream).
    moves: topShares(raw.Moves, movesTotal, 8, 400),
    items: topShares(raw.Items, itemsTotal, 8),
    abilities: topShares(raw.Abilities, abilitiesTotal, 4),
    spreads: Object.entries(raw.Spreads)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([spread, count]) => {
        const [nature, evs] = spread.split(":");
        return { nature, evs, pct: pct(count / spreadsTotal) };
      }),
    teammates: topShares(raw.Teammates, teammatesTotal, 8),
    counters,
  };
}

function parseLeads(txt) {
  // | 1    | Whimsicott         |  7.77782% | 160389 |  6.894% |
  const leads = {};
  for (const line of txt.split("\n")) {
    const m = line.match(/^\|\s*\d+\s*\|\s*(.+?)\s*\|\s*([\d.]+)%/);
    if (m) leads[m[1]] = Number(m[2]);
  }
  return leads;
}

const snapshot = {
  format: FORMAT,
  month,
  source: "Smogon/Showdown usage stats (ladder, not cartridge)",
  generated: new Date().toISOString(),
  battles: {},
  species: {},
};

for (const [tier, cutoff] of Object.entries(CUTOFFS)) {
  const base = `https://www.smogon.com/stats/${month}`;
  console.log(`fetching chaos ${tier} (${cutoff})…`);
  const gz = await (
    await fetchOk(`${base}/chaos/${FORMAT}-${cutoff}.json.gz`)
  ).arrayBuffer();
  const chaos = JSON.parse(gunzipSync(Buffer.from(gz)).toString("utf8"));
  snapshot.battles[tier] = chaos.info["number of battles"];

  console.log(`fetching leads ${tier}…`);
  const leadsTxt = await (
    await fetchOk(`${base}/leads/${FORMAT}-${cutoff}.txt`)
  ).text();
  const leads = parseLeads(leadsTxt);

  for (const [name, raw] of Object.entries(chaos.data)) {
    if (raw.usage < MIN_USAGE) continue;
    snapshot.species[name] ??= {};
    snapshot.species[name][tier] = {
      ...trimSpecies(raw),
      leadPct: leads[name] ?? null,
    };
  }
}

mkdirSync(outDir, { recursive: true });
const outFile = join(outDir, `${month}.json`);
writeFileSync(outFile, JSON.stringify(snapshot));

// Maintain the month index (history is never deleted — sparklines need it).
const indexFile = join(outDir, "index.json");
const index = existsSync(indexFile)
  ? JSON.parse(readFileSync(indexFile, "utf8"))
  : { format: FORMAT, months: [] };
if (!index.months.includes(month)) index.months.push(month);
index.months.sort();
writeFileSync(indexFile, JSON.stringify(index));

const kb = (readFileSync(outFile).length / 1024).toFixed(0);
console.log(
  `wrote ${outFile} (${kb} KB raw, ${Object.keys(snapshot.species).length} species) + index (${index.months.join(", ")})`,
);
