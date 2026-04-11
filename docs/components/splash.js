/**
 * components/splash.js — ŘΨØŬ v1.0.0 new
 */
const Splash = {
  hide(delay = 800) {
    setTimeout(() => {
      const el = document.getElementById('splash');
      if (!el) return;
      el.classList.add('out');
      el.addEventListener('transitionend', () => el.remove(), { once: true });
    }, delay);
  }
};
window.Splash = Splash;
