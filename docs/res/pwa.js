(function () {
  // ── Service Worker registration ──────────────────────────────────────
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js')
        .catch(function (e) { console.warn('[PWA] SW error:', e); });
    });
  }

  // ── Install prompt ───────────────────────────────────────────────────
  window._pwaPrompt = null;

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    window._pwaPrompt = e;

    // Kasih tau nav.js kalau prompt sudah siap
    window.dispatchEvent(new Event('pwaPromptReady'));

    // Tampilkan semua tombol install yang ada di DOM
    var btns = document.querySelectorAll('#btn-pwa-install');
    btns.forEach(function (b) { b.style.display = 'block'; });
  });

  // ── Handle klik tombol install ───────────────────────────────────────
  document.addEventListener('click', async function (e) {
    if (!e.target.closest('#btn-pwa-install')) return;
    if (!window._pwaPrompt) return;

    window._pwaPrompt.prompt();
    var result = await window._pwaPrompt.userChoice;
    if (result.outcome === 'accepted') {
      document.querySelectorAll('#btn-pwa-install')
        .forEach(function (b) { b.style.display = 'none'; });
    }
    window._pwaPrompt = null;
  });

  // ── Deteksi sudah ter-install ────────────────────────────────────────
  window.addEventListener('appinstalled', function () {
    document.querySelectorAll('#btn-pwa-install')
      .forEach(function (b) { b.style.display = 'none'; });
    window._pwaPrompt = null;
  });
})();
