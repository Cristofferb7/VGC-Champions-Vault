import { FORMAT_CODE, PIKA_API_BASE } from "../config";
import type {
  MetaSnapshot,
  NamedPct,
  PokemonDetail,
  StatLine,
  TopTeam,
  UsageEntry,
} from "../types";

/** Parses "53.4" → 53.4, "N/A"/"undefined"/garbage → null. Never fakes data. */
function parsePct(raw: string | undefined): number | null {
  if (!raw) return null;
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : null;
}

/** Extracts one markdown section's lines: from `## heading` to the next `## `. */
function sectionLines(markdown: string, heading: string): string[] {
  const start = markdown.indexOf(`## ${heading}`);
  if (start === -1) return [];
  const rest = markdown.slice(start + heading.length + 3);
  const end = rest.search(/\n## /);
  return (end === -1 ? rest : rest.slice(0, end)).split("\n");
}

/** "13846-13548-28" or "1107-1111" → wins/losses/ties. */
function parseRecord(raw: string): { wins: number; losses: number; ties: number } {
  const [wins = 0, losses = 0, ties = 0] = raw
    .split("-")
    .map((part) => Number.parseInt(part, 10) || 0);
  return { wins, losses, ties };
}

export function parseFormatIndex(markdown: string): {
  dataDate: string | null;
  entries: UsageEntry[];
  topTeams: TopTeam[];
} {
  const dataDate =
    markdown.match(/\*\*Data Date\*\*:\s*([\d-]+)/)?.[1] ?? null;

  const entries: UsageEntry[] = [];
  for (const line of sectionLines(markdown, "Best 50 Pokemon by Usage")) {
    // | 1 | **Garchomp** | N/A% | 50.543% | 13846-13548-28 | ... |
    const match = line.match(
      /^\|\s*(\d+)\s*\|\s*\*\*(.+?)\*\*\s*\|\s*([\d.]+|N\/A)%\s*\|\s*([\d.]+|N\/A)%?\s*\|\s*([\d-]+)\s*\|/,
    );
    if (!match) continue;
    const [, rank, name, usage, winRate, record] = match;
    entries.push({
      rank: Number.parseInt(rank, 10),
      name: name.trim(),
      usagePct: parsePct(usage),
      winRate: parsePct(winRate),
      ...parseRecord(record),
    });
  }

  const topTeams: TopTeam[] = [];
  for (const line of sectionLines(markdown, "Recent Top Teams")) {
    // | 1 | JoeUX9 | 14-2 | Maddo's Cup #9 \| 100€ \| Reg M-B | Swampert-Mega, … |
    // Tournament titles contain escaped pipes — split only on unescaped |.
    if (!line.trimStart().startsWith("|")) continue;
    const cells = line
      .split(/(?<!\\)\|/)
      .map((cell) => cell.replace(/\\\|/g, "|").trim())
      .filter((cell) => cell !== "");
    if (cells.length < 5) continue;

    const [rank, author, record, ...rest] = cells;
    if (!/^\d+$/.test(rank) || !/^\d+-\d+(-\d+)?$/.test(record)) continue;

    // Species are always the last cell; anything between is the title
    // (rejoined in case an unescaped pipe still slipped through).
    const speciesCell = rest[rest.length - 1];
    const event = rest
      .slice(0, -1)
      .join(" | ")
      .replace(/["\\\s]+$/, "");

    const species = speciesCell
      .split(",")
      .map((name) => name.trim())
      // Real species tokens contain letters; drop numbers/currency junk.
      .filter((name) => /^[\p{L}][\p{L}\d'’. :-]{2,}$/u.test(name));

    // A registered team has 6 members; fewer means the row is corrupt —
    // skip it rather than render broken orbs (QA round 2).
    if (species.length < 6) continue;

    topTeams.push({
      rank: Number.parseInt(rank, 10),
      author,
      event,
      ...parseRecord(record),
      species,
    });
  }

  return { dataDate, entries, topTeams };
}

/** Bullet lists shaped `- **Name**: 89.4%` (pct may be "undefined"). */
function parseNamedPctList(lines: string[]): NamedPct[] {
  const result: NamedPct[] = [];
  for (const line of lines) {
    const match = line.match(/^-\s*\*\*(.+?)\*\*:\s*([\d.]+|undefined|N\/A)%/);
    if (match) result.push({ name: match[1].trim(), pct: parsePct(match[2]) });
  }
  return result;
}

/** "Ice (4x), Dragon (2x), Fairy (2x)" → ["Ice (4x)", …]. */
function parseMatchupRow(markdown: string, label: string): string[] {
  const match = markdown.match(
    new RegExp(`\\|\\s*\\*\\*${label}\\*\\*\\s*\\|\\s*(.+?)\\s*\\|`),
  );
  if (!match || /none/i.test(match[1])) return [];
  return match[1].split(",").map((part) => part.trim()).filter(Boolean);
}

export function parsePokemonDetail(
  markdown: string,
  name: string,
): PokemonDetail {
  const winRate = parsePct(
    markdown.match(/\|\s*\*\*Win Rate\*\*\s*\|\s*([\d.]+)%/)?.[1],
  );
  const record =
    markdown.match(/\|\s*\*\*Record\*\*\s*\|\s*([\d-]+)\s*\|/)?.[1] ?? null;

  const spreadMatch = markdown.match(
    /features a \*\*(.*?)\*\* nature with an EV spread of `([\d/]+)`\.(?:\s*This configuration accounts for ([\d.]+)%)?/,
  );

  let baseStats: StatLine | null = null;
  const statPairs = [...markdown.matchAll(
    /\|\s*(HP|Attack|Defense|Sp\. Atk|Sp\. Def|Speed)\s*\|\s*(\d+)\s*\|/g,
  )];
  if (statPairs.length === 6) {
    const byLabel = Object.fromEntries(
      statPairs.map(([, label, value]) => [label, Number.parseInt(value, 10)]),
    );
    baseStats = {
      hp: byLabel["HP"],
      atk: byLabel["Attack"],
      def: byLabel["Defense"],
      spa: byLabel["Sp. Atk"],
      spd: byLabel["Sp. Def"],
      spe: byLabel["Speed"],
    };
  }

  return {
    name,
    winRate,
    record,
    weakTo: parseMatchupRow(markdown, "Weak To"),
    resists: parseMatchupRow(markdown, "Resists"),
    immuneTo: parseMatchupRow(markdown, "Immune To"),
    moves: parseNamedPctList(sectionLines(markdown, "Common Moves")),
    abilities: parseNamedPctList(sectionLines(markdown, "Common Abilities")),
    items: parseNamedPctList(sectionLines(markdown, "Common Items")),
    teammates: parseNamedPctList(sectionLines(markdown, "Common Teammates")),
    spread: spreadMatch
      ? {
          nature: spreadMatch[1] || null,
          evs: spreadMatch[2],
          pct: parsePct(spreadMatch[3]),
        }
      : null,
    baseStats,
    fetchedAt: Date.now(),
  };
}

/** Result of a conditional fetch: fresh markdown or "use what you have". */
export type ConditionalFetch =
  | { kind: "modified"; markdown: string; lastModified: string | null }
  | { kind: "not-modified" };

async function conditionalFetch(
  url: string,
  ifModifiedSince: string | null,
): Promise<ConditionalFetch> {
  const response = await fetch(url, {
    headers: ifModifiedSince ? { "If-Modified-Since": ifModifiedSince } : {},
  });
  if (response.status === 304) return { kind: "not-modified" };
  if (!response.ok) throw new Error(`Pikalytics ${response.status} for ${url}`);
  const markdown = await response.text();
  // The API 200s with this body for species absent from the format.
  if (/^Pokemon not found/i.test(markdown.trim())) {
    throw new Error(`Pikalytics has no data for ${url}`);
  }
  return {
    kind: "modified",
    markdown,
    lastModified: response.headers.get("Last-Modified"),
  };
}

export async function fetchFormatSnapshot(
  ifModifiedSince: string | null,
): Promise<MetaSnapshot | "not-modified"> {
  const result = await conditionalFetch(
    `${PIKA_API_BASE}/${FORMAT_CODE}`,
    ifModifiedSince,
  );
  if (result.kind === "not-modified") return "not-modified";
  const { dataDate, entries, topTeams } = parseFormatIndex(result.markdown);
  if (entries.length === 0) throw new Error("Pikalytics returned no usage rows");
  return {
    formatCode: FORMAT_CODE,
    dataDate,
    fetchedAt: Date.now(),
    lastModified: result.lastModified,
    entries,
    topTeams,
  };
}

export async function fetchPokemonDetail(name: string): Promise<PokemonDetail> {
  const result = await conditionalFetch(
    `${PIKA_API_BASE}/${FORMAT_CODE}/${encodeURIComponent(name)}`,
    null,
  );
  if (result.kind === "not-modified") throw new Error("unexpected 304");
  return parsePokemonDetail(result.markdown, name);
}
