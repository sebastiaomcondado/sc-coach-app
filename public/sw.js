// Minimal service worker — registered only so browsers recognize the app as
// installable. This app is inherently online (live workout/roster data), so
// deliberately no offline caching: a fetch listener is what browsers check
// for, not what it does.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {});
