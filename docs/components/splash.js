/**
 * components/splash.js — ŘΨØŬ v2.0.0
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
