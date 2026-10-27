// CJ-Vertex — service worker: a app abre sem internet; bibliotecas guardadas após o primeiro uso.
const VERSION = 'cgvertex-v6';
const CORE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png',
  './lib/jspdf.umd.min.js', './lib/docx.umd.js', './lib/pdf.min.js', './lib/pdf.worker.min.js'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname.endsWith('supabase.co')) return; // transcrição e IA: sempre pela rede
  if (url.pathname.endsWith('/painel.html')) return; // painel: sempre pela rede, nunca guardado
  if (url.pathname.includes('/minutas/')) return; // app Minutas: tem o seu próprio service worker
  if (url.origin === location.origin && /\/(index\.html)?$/.test(url.pathname)) {
    // página: rede primeiro (versão mais recente), cópia guardada se não houver internet
    e.respondWith(fetch(req).then((r) => { const cp = r.clone(); caches.open(VERSION).then((c) => c.put('./index.html', cp)); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  if (url.origin === location.origin || /cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|fonts\.(googleapis|gstatic)\.com/.test(url.hostname)) {
    // bibliotecas e tipos de letra: guardadas após o primeiro uso
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => {
      if (r.ok || r.type === 'opaque') { const cp = r.clone(); caches.open(VERSION).then((c) => c.put(req, cp)); }
      return r;
    })));
  }
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then((cs) => cs.length ? cs[0].focus() : self.clients.openWindow('./')));
});
