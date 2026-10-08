/* Service worker for Rally & Astro.
 *
 * Strategy is stale-while-revalidate for everything same-origin: the cached
 * copy is served immediately so the game opens instantly and works with no
 * network at all, while a fresh copy is fetched in the background for next
 * launch. A change therefore lands one launch late, which is the usual trade
 * and fine for a game.
 *
 * Bump VERSION when you want to force every client to drop its old cache.
 * You do not need to for ordinary edits -- revalidation picks those up.
 */
const VERSION = "v1";
const CACHE = "rally-astro-" + VERSION;

/* Relative so the app still works when served from a subpath. */
const CORE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-192.png",
  "./icons/maskable-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      /* individually, so one bad path cannot fail the whole install */
      .then((c) => Promise.all(CORE.map((u) => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k.startsWith("rally-astro-") && k !== CACHE)
            .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  /* Google Fonts: best effort. Serve a cached copy when we have one, otherwise
     go to the network. Offline without one, the page falls back to system
     fonts on its own, so nothing here is allowed to reject. */
  if (!sameOrigin) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => hit))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req).then((res) => {
        if (res && res.ok && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => null);

      /* cached first; otherwise the network; offline with neither, and for a
         page load, hand back the shell so the game still opens */
      return hit || net.then((res) => res
        || (req.mode === "navigate" ? caches.match("./index.html") : undefined));
    })
  );
});
