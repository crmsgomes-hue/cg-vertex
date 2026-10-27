// CG VERTEX Minutas: abre sempre a versão mais recente quando há internet; sem internet usa a última cópia.
// Não guarda nada dos clientes: só a página e as bibliotecas de exportação.
const VERSION = 'minutas-v10';
const CORE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('minutas-') && k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname === 'api.groq.com') return;
  if (req.mode === 'navigate' || (url.origin === location.origin && /\/minutas\/(index\.html)?$/.test(url.pathname))) {
    e.respondWith(fetch(req, { cache: 'no-store' }).then((r) => { if (r.ok) { const cp = r.clone(); caches.open(VERSION).then((c) => c.put('./index.html', cp)); } return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  if (/cdnjs\.cloudflare\.com$/.test(url.hostname) || (url.origin === location.origin && url.pathname.includes('/minutas/'))) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => { if (r.ok || r.type === 'opaque') { const cp = r.clone(); caches.open(VERSION).then((c) => c.put(req, cp)); } return r; })));
  }
});
