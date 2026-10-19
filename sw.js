// Guarda la pantalla de la app en el teléfono para que abra al instante.
// Siempre busca la versión nueva en segundo plano; el botón "Actualizar" la aplica en el momento.
const CACHE = 'cirugias-v3';
const BASE = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                       // el conector de Google (POST) no se toca
  const url = new URL(req.url);
  const propio = url.origin === self.location.origin;
  const fuentes = url.host === 'fonts.googleapis.com' || url.host === 'fonts.gstatic.com';
  if (!propio && !fuentes) return;
  const clave = propio && url.search ? url.pathname : req;  // el enlace de conexión usa la misma pantalla
  const forzarRed = req.cache === 'no-store' || req.cache === 'reload';
  e.respondWith(caches.open(CACHE).then(async cache => {
    const guardada = await cache.match(clave);
    const red = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) cache.put(clave, r.clone()); return r; });
    if (forzarRed) return red.catch(() => guardada);
    red.catch(() => {});
    return guardada || red;
  }));
});
