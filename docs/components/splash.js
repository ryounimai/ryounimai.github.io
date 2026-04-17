/**
 * components/splash.js — ŘΨØŬ v3.0.0
 * Splash screen dengan Anime.js timeline entrance + exit
 */
const Splash = (() => {
  let _dotsAnim = null;

  function _enter() {
    const logo  = document.querySelector('.splash-logo');
    const sub   = document.querySelector('.splash-sub');
    const dots  = document.querySelectorAll('.splash-dots span');
    if (!logo) return;

    /* Kalau reduced motion — langsung tampil saja */
    if (Anim.reduced) return;

    /* Set opacity:0 via style langsung — sebelum A.set()
       agar elemen tidak flash terlihat sama sekali */
    logo.style.opacity = '0';
    sub.style.opacity  = '0';
    dots.forEach(d => { d.style.opacity = '0'; });

    /* Set state awal transform via Anime.js */
    const A = Anim.raw();
    A.set(logo, { scale: 0.8 });
    A.set(sub,  { translateY: 8 });

    /* Timeline entrance */
    const tl = Anim.timeline({ defaults: { ease: 'out(2)' } });

    tl.add(logo, {
      opacity  : [0, 1],
      scale    : [0.8, 1],
      duration : 500,
    }, 0)
    .add(sub, {
      opacity   : [0, 1],
      translateY: [8, 0],
      duration  : 320,
    }, 250);

    /* Dots muncul satu-satu */
    dots.forEach((dot, i) => {
      tl.add(dot, {
        opacity : [0, 1],
        scale   : [0.5, 1],
        duration: 220,
      }, 380 + i * 90);
    });

    /* Dots loop setelah entrance selesai */
    tl.then(() => {
      _dotsAnim = Anim.raw().animate(dots, {
        scale    : [1, 1.35],
        opacity  : [1, 0.4],
        duration : 600,
        delay    : Anim.raw().stagger(200),
        ease     : 'inOut(2)',
        loop     : true,
        alternate: true,
      });
    });
  }

  function hide(delay = 400) {
    setTimeout(() => {
      const el = document.getElementById('splash');
      if (!el) return;

      /* Stop dots animation */
      if (_dotsAnim) { _dotsAnim.cancel(); _dotsAnim = null; }

      if (Anim.reduced) {
        el.remove();
        return;
      }

      /* Exit: scale up + fade out */
      Anim.raw().animate(el, {
        opacity  : [1, 0],
        scale    : [1, 1.04],
        duration : 300,
        ease     : 'out(2)',
        onComplete: () => el.remove(),
      });
    }, delay);
  }

  /* Auto-run entrance saat DOM siap */
  document.addEventListener('DOMContentLoaded', _enter, { once: true });

  return { hide };
})();

window.Splash = Splash;
