// Service Worker — AirBase PWA
const CACHE = 'airbase-v1'
const PRECACHE = ['/', '/index.html']

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  // Network first for API calls, cache first for assets
  const url = new URL(e.request.url)
  const isAPI = url.hostname.includes('supabase') || url.hostname.includes('googleapis')
  const isAsset = e.request.url.match(/\.(js|css|woff2?|png|svg|ico)(\?|$)/)

  if (isAPI) {
    // Always network for API — no caching
    e.respondWith(fetch(e.request).catch(() => new Response('Offline', { status: 503 })))
  } else if (isAsset) {
    // Cache first for static assets
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone()
          caches.open(CACHE).then(c => c.put(e.request, clone))
        }
        return res
      }))
    )
  } else {
    // Network with offline fallback for pages
    e.respondWith(
      fetch(e.request).catch(() => caches.match('/index.html'))
    )
  }
})
