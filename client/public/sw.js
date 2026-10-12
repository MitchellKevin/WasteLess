// Service worker for the published website (not used in development or in the iOS/Android app).
// Pages come from the network first, so a new deploy shows up on the next visit; the cache is
// only a fallback when offline. Built files in /assets/ have a hash in their name and never change,
// so those can safely be served from the cache. Other sites (recipes, videos) are never cached.
const CACHE = 'wasteless-v2'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (e) => {
  // Removes the old cache (wasteless-v1) that kept serving an outdated version of the app
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

const store = (request, response) => {
  if (response.ok) {
    const copy = response.clone()
    caches.open(CACHE).then((c) => c.put(request, copy))
  }
  return response
}

self.addEventListener('fetch', (e) => {
  const { request } = e
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return

  if (url.pathname.startsWith('/assets/')) {
    e.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((res) => store(request, res))))
    return
  }

  // Pages (any route of the app) all share index.html; keep the latest copy for offline use
  const key = request.mode === 'navigate' ? '/' : request
  e.respondWith(
    fetch(request)
      .then((res) => store(key, res))
      .catch(() => caches.match(key))
  )
})
