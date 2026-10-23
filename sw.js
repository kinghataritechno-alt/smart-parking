/* Bureau Parking service worker
   - หน้าแอป: ใช้ของใหม่จากเน็ตก่อน ถ้าไม่มีสัญญาณค่อยใช้ของที่เก็บไว้
   - ไฟล์คงที่ (ไอคอน, ฟอนต์, ตัวสร้าง PDF): ใช้ของที่เก็บไว้ก่อน
   - ข้อมูล Supabase: ไม่เก็บเลย
   เปลี่ยนเลข VERSION ทุกครั้งที่อัปโหลด index.html ใหม่ */
const VERSION = 'bp-1.3.4';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './apple-touch-icon.png', './login-bg.webp', './login-floor.jpg', './logo-smart-terminal.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.hostname.endsWith('supabase.co') || url.pathname.includes('/rest/v1/')) return;

  const isPage = req.mode === 'navigate' || (url.origin === location.origin && /\/(index\.html)?$/.test(url.pathname));
  if (isPage) {
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put('./index.html', copy)); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  const cacheable = url.origin === location.origin || /(fonts\.googleapis\.com|fonts\.gstatic\.com|cdnjs\.cloudflare\.com)$/.test(url.hostname);
  if (!cacheable) return;
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok || r.type === 'opaque') { const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
    return r;
  })));
});
