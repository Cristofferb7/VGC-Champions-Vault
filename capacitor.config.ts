import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Android wrap of the same built web app (sprint 8). The dist/ bundle is
 * packaged INTO the APK — no remote server.url — so the app boots offline
 * exactly like the installed PWA. Network calls that rely on Vercel
 * rewrites (/pika) or fresh snapshots use an absolute origin on native
 * (see API_ORIGIN in src/config.ts).
 *
 * appId per SPRINT_8_HANDOFF §1 — flagged for the user to confirm.
 */
const config: CapacitorConfig = {
  appId: "com.cristoffer.championsvault",
  appName: "Champions Vault",
  webDir: "dist",
  android: {
    backgroundColor: "#0B0E14",
  },
};

export default config;
