// Service worker : met l'app en cache pour fonctionner sans réseau.
// Change VERSION à chaque mise à jour du contenu pour forcer le rafraîchissement.
const VERSION = "jsl-v13";
const FILES = [
  "./", "index.html", "styles.css", "app.js", "content.js", "config.js",
  "manifest.webmanifest", "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png",
  "img/accroupie-still.svg", "img/accroupie.svg", "img/accueil-still.svg", "img/accueil.svg", "img/ballon-still.svg", "img/ballon.svg", "img/chaise-envers-still.svg", "img/chaise-envers.svg", "img/cote-coussin-still.svg", "img/cote-coussin.svg", "img/eau-chaude-still.svg", "img/eau-chaude.svg", "img/fente-still.svg", "img/fente.svg", "img/genoux-lit-still.svg", "img/genoux-lit.svg", "img/hanches-still.svg", "img/hanches.svg", "img/marcher-still.svg", "img/marcher.svg", "img/massage-still.svg", "img/massage.svg", "img/quatre-pattes-still.svg", "img/quatre-pattes.svg", "img/semi-assise-still.svg", "img/semi-assise.svg", "img/slow-dance-still.svg", "img/slow-dance.svg", "img/suspension-still.svg", "img/suspension.svg", "img/tailleur-still.svg", "img/tailleur.svg",
  "img/f/accroupie-still.svg", "img/f/accroupie.svg", "img/f/accueil-still.svg", "img/f/accueil.svg", "img/f/ballon-still.svg", "img/f/ballon.svg", "img/f/chaise-envers-still.svg", "img/f/chaise-envers.svg", "img/f/cote-coussin-still.svg", "img/f/cote-coussin.svg", "img/f/eau-chaude-still.svg", "img/f/eau-chaude.svg", "img/f/fente-still.svg", "img/f/fente.svg", "img/f/genoux-lit-still.svg", "img/f/genoux-lit.svg", "img/f/hanches-still.svg", "img/f/hanches.svg", "img/f/marcher-still.svg", "img/f/marcher.svg", "img/f/massage-still.svg", "img/f/massage.svg", "img/f/quatre-pattes-still.svg", "img/f/quatre-pattes.svg", "img/f/semi-assise-still.svg", "img/f/semi-assise.svg", "img/f/slow-dance-still.svg", "img/f/slow-dance.svg", "img/f/suspension-still.svg", "img/f/suspension.svg", "img/f/tailleur-still.svg", "img/f/tailleur.svg"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request).then((res) => {
      if (res.ok && new URL(e.request.url).origin === location.origin) {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match("index.html")))
  );
});
