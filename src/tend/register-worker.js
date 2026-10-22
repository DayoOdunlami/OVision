/** Install the complete local book on production/preview origins and localhost. */
export function registerWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  const install = () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .catch(() => {
        // The app can still work online if storage is restricted. Registration is
        // retried on the next launch; never discard the household's saved data.
      });
  };
  if (document.readyState === 'complete') install();
  else window.addEventListener('load', install, { once: true });
}
