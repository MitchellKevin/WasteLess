// Fades out the splash screen from index.html once the app is ready.
// It stays until the animation has finished plus about a second on the finished splash.
const MIN_VISIBLE_MS = 2600
const MIN_VISIBLE_REDUCED_MS = 400

export function hideSplash() {
  const el = document.getElementById('splash')
  if (!el) return
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const legalPage = ['/privacy', '/terms', '/delete-account'].includes(window.location.pathname)
  const minimum = legalPage ? 0 : reduced ? MIN_VISIBLE_REDUCED_MS : MIN_VISIBLE_MS
  // Wait for the fonts so the app doesn't appear in a fallback font (but never longer than a second)
  const fonts = Promise.race([document.fonts?.ready, new Promise((r) => setTimeout(r, 1000))])
  fonts.then(() => {
    setTimeout(() => {
      el.classList.add('splash--hide')
      el.addEventListener('transitionend', () => el.remove(), { once: true })
      setTimeout(() => el.remove(), 600) // in case transitionend doesn't fire
    }, Math.max(0, minimum - performance.now()))
  })
}
