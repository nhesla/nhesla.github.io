// coi-serviceworker.js
// Injects Cross-Origin-Opener-Policy and Cross-Origin-Embedder-Policy headers
// so Godot HTML5 exports can use SharedArrayBuffer on GitHub Pages.
// Based on: https://github.com/nicolo-ribaudo/coi-serviceworker

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (e) => {
  if (e.request.cache === "only-if-cached" && e.request.mode !== "same-origin") return;

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.status === 0) return res;
        const newHeaders = new Headers(res.headers);
        newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");
        newHeaders.set("Cross-Origin-Embedder-Policy", "credentialless");
        newHeaders.set("Cross-Origin-Resource-Policy", "cross-origin");
        return new Response(res.body, {
          status: res.status,
          statusText: res.statusText,
          headers: newHeaders,
        });
      })
      .catch((e) => console.error(e))
  );
});