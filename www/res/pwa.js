(function() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(e => console.warn('[PWA]', e));
    });
  }
  let _prompt = null;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); _prompt = e; });
  document.addEventListener('click', async e => {
    if (!e.target.closest('#btn-pwa-install') || !_prompt) return;
    _prompt.prompt();
    const { outcome } = await _prompt.userChoice;
    if (outcome === 'accepted') document.getElementById('btn-pwa-install')?.remove();
    _prompt = null;
  });
})();
