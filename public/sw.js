/**
 * Offline support, kept deliberately small.
 *
 * Three rules, and the first one exists because getting it wrong is invisible
 * and permanent.
 *
 * 1. The page itself is fetched from the network, falling back to the cache
 *    when there is none. `index.html` names the hashed bundles the app is made
 *    of, so caching it first means a returning visitor is served the shell they
 *    saw on their very first visit, for ever — every deploy landing on a
 *    browser that will not look at it. That is precisely what happened here:
 *    the Arabic build went out and the page kept rendering the version from
 *    before it, with fresh data on top, which made it look like a missing
 *    feature rather than a stale cache.
 *
 * 2. Hashed assets are cache-first, which is safe because their names change
 *    whenever their contents do.
 *
 * 3. The index is network-first: a scholarship list a day old is worth having,
 *    one silently a month old is not.
 */

const VERSION = 'v2'
const SHELL = `shell-${VERSION}`
const DATA = `data-${VERSION}`

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(caches.open(SHELL))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== SHELL && k !== DATA).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  )
})

/** Network, with the cache as a fallback and a copy kept for next time. */
function networkFirst(request, cacheName) {
  return fetch(request)
    .then((response) => {
      if (response.ok) {
        const copy = response.clone()
        caches.open(cacheName).then((cache) => cache.put(request, copy))
      }
      return response
    })
    .catch(() =>
      caches.match(request).then((hit) => hit || caches.match('./').then((root) => root || Response.error()))
    )
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // 1. The page.
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(networkFirst(request, SHELL))
    return
  }

  // 3. The index.
  if (url.pathname.includes('/data/')) {
    event.respondWith(networkFirst(request, DATA))
    return
  }

  // 2. Everything else — hashed assets, fonts, icons.
  event.respondWith(
    caches.match(request).then((hit) => {
      if (hit) return hit
      return fetch(request).then((response) => {
        if (response.ok && response.type === 'basic') {
          const copy = response.clone()
          caches.open(SHELL).then((cache) => cache.put(request, copy))
        }
        return response
      })
    })
  )
})
