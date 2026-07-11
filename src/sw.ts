/// <reference lib="webworker" />
import { clientsClaim } from "workbox-core";
import { precacheAndRoute, createHandlerBoundToURL } from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";
import { CacheFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";

declare const self: ServiceWorkerGlobalScope;

// autoUpdate semantics (generateSW added these implicitly before the
// switch to injectManifest): new SW takes over open pages immediately.
void self.skipWaiting();
clientsClaim();

/** Cache + key where a share_target screenshot waits for the app. */
export const SHARE_CACHE = "share-target";
export const SHARE_KEY = "/shared-screenshot";

// App shell (injected by vite-plugin-pwa at build time).
precacheAndRoute(self.__WB_MANIFEST);

// SPA navigations → precached index.html (offline boot).
registerRoute(
  new NavigationRoute(createHandlerBoundToURL("/index.html"), {
    denylist: [/^\/pika\//, /^\/share-target/],
  }),
);

// Self-hosted tesseract assets (~25 MB with language data) are cached on
// first OCR use, not precached — keeps install light while making OCR
// work offline afterwards.
registerRoute(
  ({ url }) => url.pathname.startsWith("/tesseract/"),
  new CacheFirst({
    cacheName: "tesseract-assets",
    plugins: [new ExpirationPlugin({ maxEntries: 12 })],
  }),
);

// Android share_target: the OS POSTs the shared screenshot here. Stash it
// in Cache Storage and bounce to the app, which consumes it on boot
// (src/lib/shareTarget.ts).
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method === "POST" && url.pathname === "/share-target") {
    event.respondWith(
      (async () => {
        try {
          const form = await event.request.formData();
          const file = form.get("screenshot");
          if (file instanceof File) {
            const cache = await caches.open(SHARE_CACHE);
            await cache.put(
              SHARE_KEY,
              new Response(file, { headers: { "content-type": file.type } }),
            );
          }
        } catch {
          // fall through — app opens without a pending screenshot
        }
        return Response.redirect("/?shared=1", 303);
      })(),
    );
  }
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") void self.skipWaiting();
});
