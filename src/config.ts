import { Capacitor } from "@capacitor/core";

/**
 * Format configuration — regulation churn is quarterly, so everything
 * format-specific hangs off this one constant (Season 4 rolls over
 * 2026-09-02; update FORMAT_CODE only).
 */
export const FORMAT_CODE = "battledataregmbs3";

/**
 * In the Capacitor APK there is no Vercel in front of us: the /pika
 * rewrite doesn't exist there and bundled snapshots are frozen at build
 * time. Native platforms therefore call the deployed origin absolutely;
 * web keeps same-origin paths (dev proxy / Vercel rewrites).
 */
export const API_ORIGIN = Capacitor.isNativePlatform()
  ? "https://champions-analyzer.vercel.app"
  : "";

/** Prefix a same-origin path so it also works inside the APK. */
export const withApiOrigin = (path: string) => `${API_ORIGIN}${path}`;

/** Dev-proxied Pikalytics AI API base (see vite.config.ts). */
export const PIKA_API_BASE = `${API_ORIGIN}/pika/ai/pokedex`;

export const PIKA_ATTRIBUTION_URL = "https://www.pikalytics.com";

/** Snapshot older than this is shown as stale until revalidated. */
export const SNAPSHOT_TTL_MS = 24 * 60 * 60 * 1000;
