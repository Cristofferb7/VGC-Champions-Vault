/**
 * Format configuration — regulation churn is quarterly, so everything
 * format-specific hangs off this one constant (Season 4 rolls over
 * 2026-09-02; update FORMAT_CODE only).
 */
export const FORMAT_CODE = "battledataregmbs3";

/** Dev-proxied Pikalytics AI API base (see vite.config.ts). */
export const PIKA_API_BASE = "/pika/ai/pokedex";

export const PIKA_ATTRIBUTION_URL = "https://www.pikalytics.com";

/** Snapshot older than this is shown as stale until revalidated. */
export const SNAPSHOT_TTL_MS = 24 * 60 * 60 * 1000;
