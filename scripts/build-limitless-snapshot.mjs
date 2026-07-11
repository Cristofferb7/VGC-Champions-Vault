#!/usr/bin/env node
/**
 * Limitless tournament ingest + archetype clustering (sprint 6 item 2).
 *
 * Pulls completed VGC tournaments for the current regulation from the
 * keyless Limitless API (play.limitlesstcg.com/api — verified: tournament
 * list, details, and standings incl. full team sheets need no key),
 * appends new teams to the CUMULATIVE per-regulation snapshot, re-runs
 * clustering over all teams, and writes
 * public/snapshots/limitless/<regulation>.json.
 *
 * Run weekly by .github/workflows/limitless-snapshot.yml (Mondays), or
 * manually: node scripts/build-limitless-snapshot.mjs
 *
 * Clustering (in CI, never in the browser): k-means over multi-hot
 * species vectors, k picked by silhouette in 4..10, clusters named by
 * lift (in-cluster frequency vs global frequency), thin clusters fold
 * into "Other" — outliers are never force-fit.
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REGULATION = "M-B";
const API = "https://play.limitlesstcg.com/api";
const MIN_PLAYERS = 12; // skip micro-events
const MIN_CLUSTER_TEAMS = 5; // thinner clusters fold into "Other"
const VOCAB_MIN_COUNT = 3; // species must appear on ≥3 teams to be a feature

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const slug = `reg-${REGULATION.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
// Full cumulative state (all team sheets) lives in data/ — repo-committed
// but NOT shipped; the app gets a trimmed clusters-only snapshot.
const stateDir = join(root, "data", "limitless");
const stateFile = join(stateDir, `${slug}-full.json`);
const outDir = join(root, "public", "snapshots", "limitless");
const outFile = join(outDir, `${slug}.json`);

/**
 * Limitless sheets store base species + the mega stone as the held item
 * ("Charizard" + "Charizardite Y"). Rewrite to the app's "-Mega" naming so
 * clusters match Pikalytics/opponent names and sprites resolve.
 */
function withMegaForm(species, item) {
  if (!item || !item.startsWith(species.slice(0, 6))) return species;
  const match = item.match(/ite( [XY])?$/);
  if (!match) return species;
  return match[1] ? `${species}-Mega-${match[1].trim()}` : `${species}-Mega`;
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

// ---------- ingest ----------

const existing = existsSync(stateFile)
  ? JSON.parse(readFileSync(stateFile, "utf8"))
  : { regulation: REGULATION, tournaments: [], teams: [] };
const knownIds = new Set(existing.tournaments.map((t) => t.id));

console.log(`known tournaments: ${knownIds.size}, teams: ${existing.teams.length}`);

const list = await fetchJson(
  `${API}/tournaments?game=VGC&format=${encodeURIComponent(REGULATION)}&limit=200`,
);
const candidates = list.filter(
  (t) =>
    !knownIds.has(t.id) &&
    t.players >= MIN_PLAYERS &&
    new Date(t.date).getTime() < Date.now() - 6 * 3600_000, // finished
);
console.log(`new candidate tournaments: ${candidates.length}`);

for (const tournament of candidates) {
  let standings;
  try {
    standings = await fetchJson(`${API}/tournaments/${tournament.id}/standings`);
  } catch (err) {
    console.warn(`skip ${tournament.name}: ${err.message}`);
    continue;
  }
  const teams = standings
    .filter((entry) => Array.isArray(entry.decklist) && entry.decklist.length === 6)
    .map((entry) => ({
      species: entry.decklist.map((mon) =>
        withMegaForm(mon.name, mon.item ?? null),
      ),
      items: entry.decklist.map((mon) => mon.item ?? null),
      player: entry.name,
      placing: entry.placing,
      players: tournament.players,
      record: entry.record
        ? `${entry.record.wins}-${entry.record.losses}${entry.record.ties ? `-${entry.record.ties}` : ""}`
        : null,
      event: tournament.name,
      date: tournament.date.slice(0, 10),
    }));
  if (teams.length === 0) continue;
  existing.tournaments.push({
    id: tournament.id,
    name: tournament.name,
    date: tournament.date.slice(0, 10),
    players: tournament.players,
    teamsWithSheets: teams.length,
  });
  existing.teams.push(...teams);
  console.log(`+ ${tournament.name}: ${teams.length} team sheets`);
}

// ---------- clustering ----------

const teams = existing.teams;
const speciesCount = new Map();
for (const team of teams)
  for (const s of team.species)
    speciesCount.set(s, (speciesCount.get(s) ?? 0) + 1);
const vocab = [...speciesCount.entries()]
  .filter(([, c]) => c >= VOCAB_MIN_COUNT)
  .map(([s]) => s)
  .sort();
const vIndex = new Map(vocab.map((s, i) => [s, i]));
const globalFreq = vocab.map((s) => speciesCount.get(s) / teams.length);

const vectors = teams.map((team) => {
  const v = new Float64Array(vocab.length);
  for (const s of team.species) if (vIndex.has(s)) v[vIndex.get(s)] = 1;
  return v;
});

const dist = (a, b) => {
  let d = 0;
  for (let i = 0; i < a.length; i++) d += (a[i] - b[i]) ** 2;
  return Math.sqrt(d);
};

function kmeans(k, iterations = 40) {
  // k-means++ seeding, deterministic via a simple LCG
  let seed = 42;
  const rand = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32;
  const centroids = [vectors[Math.floor(rand() * vectors.length)].slice()];
  while (centroids.length < k) {
    const d2 = vectors.map((v) => Math.min(...centroids.map((c) => dist(v, c) ** 2)));
    const total = d2.reduce((a, b) => a + b, 0);
    let pick = rand() * total;
    let idx = 0;
    while (pick > d2[idx]) pick -= d2[idx++];
    centroids.push(vectors[Math.min(idx, vectors.length - 1)].slice());
  }
  let assign = new Array(vectors.length).fill(0);
  for (let iter = 0; iter < iterations; iter++) {
    let moved = false;
    assign = vectors.map((v, i) => {
      let best = 0;
      let bestD = Infinity;
      centroids.forEach((c, j) => {
        const d = dist(v, c);
        if (d < bestD) {
          bestD = d;
          best = j;
        }
      });
      if (best !== assign[i]) moved = true;
      return best;
    });
    for (let j = 0; j < k; j++) {
      const members = vectors.filter((_, i) => assign[i] === j);
      if (members.length === 0) continue;
      const c = centroids[j];
      for (let f = 0; f < c.length; f++)
        c[f] = members.reduce((a, v) => a + v[f], 0) / members.length;
    }
    if (!moved) break;
  }
  return { assign, centroids };
}

/** Mean silhouette on a sample (full pairwise is O(n²) — cap it). */
function silhouette(assign, k) {
  const sample = vectors.length > 400 ? vectors.filter((_, i) => i % Math.ceil(vectors.length / 400) === 0) : vectors;
  const sampleAssign = assign.filter((_, i) => (vectors.length > 400 ? i % Math.ceil(vectors.length / 400) === 0 : true));
  let total = 0;
  for (let i = 0; i < sample.length; i++) {
    const byCluster = new Map();
    for (let j = 0; j < sample.length; j++) {
      if (i === j) continue;
      const c = sampleAssign[j];
      if (!byCluster.has(c)) byCluster.set(c, []);
      byCluster.get(c).push(dist(sample[i], sample[j]));
    }
    const own = byCluster.get(sampleAssign[i]);
    if (!own || own.length === 0) continue;
    const a = own.reduce((x, y) => x + y, 0) / own.length;
    let b = Infinity;
    for (const [c, ds] of byCluster) {
      if (c === sampleAssign[i]) continue;
      b = Math.min(b, ds.reduce((x, y) => x + y, 0) / ds.length);
    }
    if (b !== Infinity) total += (b - a) / Math.max(a, b);
  }
  return total / sample.length;
}

let clusters = [];
if (teams.length >= 30) {
  let best = null;
  for (let k = 4; k <= Math.min(10, Math.floor(teams.length / 10)); k++) {
    const run = kmeans(k);
    const score = silhouette(run.assign, k);
    console.log(`k=${k} silhouette=${score.toFixed(3)}`);
    if (!best || score > best.score) best = { ...run, k, score };
  }

  const pct = (x) => Math.round(x * 1000) / 10;
  const rawClusters = [];
  for (let j = 0; j < best.k; j++) {
    const memberIdx = teams.map((_, i) => i).filter((i) => best.assign[i] === j);
    if (memberIdx.length < MIN_CLUSTER_TEAMS) continue; // → "Other"
    const freq = vocab.map((s, f) => ({
      name: s,
      freq: memberIdx.filter((i) => vectors[i][f] === 1).length / memberIdx.length,
      lift:
        memberIdx.filter((i) => vectors[i][f] === 1).length /
        memberIdx.length /
        (globalFreq[f] || 1e-9),
    }));
    const core = freq
      .filter((s) => s.freq >= 0.35)
      .sort((a, b) => b.freq - a.freq)
      .slice(0, 8);
    // Name by most-distinctive common species (lift = how over-represented
    // vs the whole field); fill from core so every cluster gets two names.
    const distinctive = freq
      .filter((s) => s.freq >= 0.5)
      .sort((a, b) => b.lift - a.lift)
      .slice(0, 2);
    for (const c of core) {
      if (distinctive.length >= 2) break;
      if (!distinctive.some((d) => d.name === c.name)) distinctive.push(c);
    }
    // Placing can be null (drops) — such sheets still count for clustering
    // but are excluded from placing stats and examples.
    const placed = memberIdx.filter((i) => typeof teams[i].placing === "number");
    const placingPctls = placed.map(
      (i) => 1 - (teams[i].placing - 1) / Math.max(1, teams[i].players - 1),
    );
    const examples = placed
      .map((i) => teams[i])
      .sort((a, b) => a.placing - b.placing)
      .slice(0, 3)
      .map((t) => ({ player: t.player, event: t.event, placing: t.placing, species: t.species }));
    rawClusters.push({
      id: rawClusters.length,
      name: distinctive.map((s) => s.name).join(" + ") || `Cluster ${j}`,
      teams: memberIdx.length,
      sharePct: pct(memberIdx.length / teams.length),
      avgPlacingPctl: placingPctls.length
        ? pct(placingPctls.reduce((a, b) => a + b, 0) / placingPctls.length)
        : null,
      core: core.map(({ name, freq }) => ({ name, freq: pct(freq) })),
      // Sparse centroid for in-app cosine similarity (freq ≥ 5%).
      centroid: Object.fromEntries(
        freq.filter((s) => s.freq >= 0.05).map((s) => [s.name, pct(s.freq)]),
      ),
      examples,
    });
  }
  const clustered = rawClusters.reduce((a, c) => a + c.teams, 0);
  clusters = [
    ...rawClusters.sort((a, b) => b.teams - a.teams),
    {
      id: -1,
      name: "Other",
      teams: teams.length - clustered,
      sharePct: pct((teams.length - clustered) / teams.length),
      avgPlacingPctl: null,
      core: [],
      examples: [],
    },
  ];
  console.log(`k=${best.k} silhouette=${best.score.toFixed(3)} → ${rawClusters.length} named clusters + Other`);
} else {
  console.log(`only ${teams.length} teams — skipping clustering (need ≥30)`);
}

// Full cumulative state (input for the next run).
mkdirSync(stateDir, { recursive: true });
writeFileSync(
  stateFile,
  JSON.stringify({
    regulation: REGULATION,
    tournaments: existing.tournaments,
    teams,
  }),
);

// Trimmed app snapshot: clusters + summary only, no per-team sheets.
const snapshot = {
  regulation: REGULATION,
  source: "Limitless (play.limitlesstcg.com) tournament results",
  updated: new Date().toISOString().slice(0, 10),
  tournamentCount: existing.tournaments.length,
  teamCount: teams.length,
  clusters,
};
mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, JSON.stringify(snapshot));
writeFileSync(
  join(outDir, "index.json"),
  JSON.stringify({ regulations: [slug] }),
);
console.log(
  `state: ${(readFileSync(stateFile).length / 1024).toFixed(0)} KB (${teams.length} teams) · app snapshot: ${(readFileSync(outFile).length / 1024).toFixed(0)} KB, ${clusters.length} clusters`,
);
