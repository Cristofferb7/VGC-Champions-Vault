/**
 * Lightweight fuzzy match: exact prefix beats word-boundary beats
 * subsequence. Returns a score (higher = better) or -1 for no match.
 */
export function fuzzyScore(query: string, candidate: string): number {
  const q = query.trim().toLowerCase();
  const c = candidate.toLowerCase();
  if (!q) return 0;
  if (c.startsWith(q)) return 100 - c.length;
  if (c.includes(q)) return 60 - c.indexOf(q);

  // Subsequence: every query char appears in order.
  let ci = 0;
  for (const ch of q) {
    ci = c.indexOf(ch, ci);
    if (ci === -1) return -1;
    ci += 1;
  }
  return 20 - c.length;
}

/** Classic edit distance — used to correct OCR output against the lexicon. */
export function levenshtein(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const dist = Array.from({ length: rows }, (_, i) => {
    const row = new Array<number>(cols).fill(0);
    row[0] = i;
    return row;
  });
  for (let j = 0; j < cols; j++) dist[0][j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dist[i][j] = Math.min(
        dist[i - 1][j] + 1,
        dist[i][j - 1] + 1,
        dist[i - 1][j - 1] + cost,
      );
    }
  }
  return dist[a.length][b.length];
}

/** 0–1 similarity between an OCR token and a candidate name. */
export function similarity(a: string, b: string): number {
  const left = a.toLowerCase().trim();
  const right = b.toLowerCase().trim();
  if (!left || !right) return 0;
  const distance = levenshtein(left, right);
  return 1 - distance / Math.max(left.length, right.length);
}

export function fuzzyFilter<T>(
  query: string,
  items: T[],
  key: (item: T) => string,
): T[] {
  if (!query.trim()) return items;
  return items
    .map((item) => ({ item, score: fuzzyScore(query, key(item)) }))
    .filter(({ score }) => score >= 0)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
}
