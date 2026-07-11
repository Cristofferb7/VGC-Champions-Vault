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
