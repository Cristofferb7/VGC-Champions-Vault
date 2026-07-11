import { Capacitor } from "@capacitor/core";

/** Mirrors src/sw.ts — same cache the PWA share_target flow uses. */
const SHARE_CACHE = "share-target";
const SHARE_KEY = "/shared-screenshot";

/**
 * Native (APK) counterpart of the PWA share_target: when Android hands
 * us a screenshot via the share sheet (@capgo/capacitor-share-target),
 * park it in the SAME Cache Storage slot the service-worker path uses,
 * then invoke `onShared` — from there the existing
 * share-landing → Analyzer → OCR flow takes over unmodified.
 *
 * No-op on web; the plugin is lazy-imported so it never enters the web
 * bundle's critical path.
 */
export function initNativeShareIntent(onShared: () => void): void {
  if (!Capacitor.isNativePlatform()) return;

  void import("@capgo/capacitor-share-target").then(
    ({ CapacitorShareTarget }) => {
      void CapacitorShareTarget.addListener("shareReceived", async (event) => {
        const image = event.files?.find((file) =>
          file.mimeType?.startsWith("image/"),
        );
        if (!image) return;
        try {
          // content:// URIs aren't directly fetchable from the WebView;
          // convertFileSrc maps them onto the local origin.
          const res = await fetch(Capacitor.convertFileSrc(image.uri));
          const blob = await res.blob();
          const cache = await caches.open(SHARE_CACHE);
          await cache.put(
            SHARE_KEY,
            new Response(blob, {
              headers: { "Content-Type": blob.type || "image/png" },
            }),
          );
          onShared();
        } catch {
          // Unreadable share — the user can still enter the team manually.
        }
      });
    },
  );
}
