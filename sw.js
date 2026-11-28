/* 薩米物語：離線快取（Service Worker）
   第二次開遊戲幾乎不用重新下載；更新時只下載有變的檔案（js 網址帶內容雜湊 ?v=…，tools/stamp.js）。
   - index.html：先上網拿最新（4 秒拿不到才用快取），所以一更新就會拿到新版本號。
   - 帶 ?v= 的檔案（程式、模型）：直接用快取；新版本的網址不同才下載，下載後把同一個檔案的舊版本刪掉。
   - 圖片等沒有版本號的檔案：先用快取，同時在背景更新。
   - 音樂（很大、瀏覽器會分段讀取）、存檔與連線伺服器、Google 登入、Firestore：一律不經過快取。 */
const CACHE = 'sami-v1';
const CDN_OK = /^https:\/\/(www\.gstatic\.com\/firebasejs\/|fonts\.gstatic\.com\/)/;/* 網址本身就帶版本的外部檔案 */
self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil((async () => { for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k); await self.clients.claim(); })()); });
const isIndex = (u) => u.origin === self.location.origin && (/\/$/.test(u.pathname) || /\/index\.html$/.test(u.pathname));
async function put(req, res) {
  if (!res || !(res.ok || (res.type === 'opaque' && CDN_OK.test(req.url))) || !(res.type === 'basic' || res.type === 'cors' || res.type === 'opaque')) return;/* 外部帶版本的檔案（Firebase、字型）是不透明回應，也收 */
  const c = await caches.open(CACHE); const u = new URL(req.url);
  if (u.searchParams.has('v')) {/* 同一個檔案的舊版本刪掉，快取不會越長越大 */
    for (const k of await c.keys()) { const ku = new URL(k.url); if (ku.pathname === u.pathname && ku.search !== u.search) await c.delete(k); }
  }
  await c.put(req, res);
}
async function networkFirst(req) {
  const c = await caches.open(CACHE); const key = new Request(new URL(req.url).pathname.replace(/\/$/, '/index.html'));
  try {
    const res = await Promise.race([fetch(req), new Promise((_, no) => setTimeout(() => no(new Error('timeout')), 4000))]);
    if (res && res.ok) c.put(key, res.clone());
    return res;
  } catch (e) { const hit = await c.match(key); if (hit) return hit; return fetch(req); }
}
async function cacheFirst(req) { const hit = await caches.match(req); if (hit) return hit; const res = await fetch(req); put(req, res.clone()); return res; }
async function staleRevalidate(req) {
  const hit = await caches.match(req);
  const net = fetch(req).then((res) => { put(req, res.clone()); return res; }).catch(() => hit);
  return hit || net;
}
self.addEventListener('fetch', (e) => {
  const req = e.request; if (req.method !== 'GET' || req.headers.has('range')) return;
  const u = new URL(req.url);
  if (u.origin === self.location.origin) {
    if (req.mode === 'navigate' || isIndex(u)) { if (u.searchParams.has('_')) return;/* 檢查更新：直接上網 */ e.respondWith(networkFirst(req)); return; }
    if (/\/audio\//.test(u.pathname) || /\/(sw\.js|manifest\.json)$/.test(u.pathname)) return;
    if (u.searchParams.has('v')) { e.respondWith(cacheFirst(req)); return; }
    if (/\.(png|jpg|jpeg|webp|gif|svg|bin|json)$/.test(u.pathname)) { e.respondWith(staleRevalidate(req)); return; }
    return;
  }
  if (CDN_OK.test(req.url)) { e.respondWith(cacheFirst(req)); return; }
  if (/^https:\/\/fonts\.googleapis\.com\//.test(req.url)) { e.respondWith(staleRevalidate(req)); return; }
});
