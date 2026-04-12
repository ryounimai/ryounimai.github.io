/**
 * components/carousel.js — ŘΨØŬ v2.0.2
 * Hero Swiper carousel — top 8 highest rated
 */
const Carousel = (() => {
  let _swiper = null;

  function _slideHtml(item) {
    const title = I18n.titleOf(item);
    const desc  = (I18n.descOf(item) || '').slice(0, 180);
    const genres = (item.genres || []).slice(0, 3);
    return `
<div class="swiper-slide hero-slide">
  <div class="hero-bg" style="background-image:url('${item.banner||item.poster||''}')"></div>
  <div class="hero-ov-l"></div>
  <div class="hero-ov-b"></div>
  <div class="hero-content">
    <div class="hero-text">
      <div class="hero-meta">
        <span class="badge-ryou badge-ghost">${item.year||'—'}</span>
        ${item.rating > 0 ? `<span class="badge-ryou badge-warning">⭐ ${Number(item.rating).toFixed(1)}</span>` : ''}
        <span class="badge-ryou badge-accent">${item.type||'TV'}</span>
        <span class="badge-ryou badge-${item.status==='Ongoing'?'success':'ghost'}">
          ${item.status==='Ongoing'?I18n.t('ongoing'):I18n.t('completed')}
        </span>
      </div>
      <h2 class="hero-title">${title}</h2>
      <div class="hero-genres">
        ${genres.map(g=>`<span class="hero-genre-chip">${g}</span>`).join('')}
      </div>
      ${desc ? `<p class="hero-desc">${desc}${desc.length===180?'…':''}</p>` : ''}
      <div class="hero-actions">
        <button class="btn btn-primary" data-id="${item.id}" data-action="watch">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          ${I18n.t('watch_now')}
        </button>
        <button class="btn btn-outline" data-id="${item.id}" data-action="detail">
          ${I18n.t('info')}
        </button>
      </div>
    </div>
    <div class="hero-poster fade-in">
      <img src="${item.poster||''}" alt="${title}" loading="lazy" onerror="this.parentElement.style.display='none'">
    </div>
  </div>
</div>`;
  }

  function render(library) {
    const el = document.getElementById('hero-swiper');
    if (!el) return;
    if (!library || !library.length) { el.closest('.hero-section')?.remove(); return; }

    const top = [...library]
      .filter(a => a.poster)
      .sort((a, b) => (b.rating||0) - (a.rating||0))
      .slice(0, 8);

    const wrapper = el.querySelector('.swiper-wrapper');
    if (!wrapper) return;
    wrapper.innerHTML = top.map(_slideHtml).join('');

    // Bind buttons
    el.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.action === 'watch') App.goWatch(btn.dataset.id);
        else App.goDetail(btn.dataset.id);
      });
    });

    if (_swiper) { _swiper.destroy(true, true); _swiper = null; }
    if (top.length > 1) {
      _swiper = new Swiper(el, {
        loop: true, autoplay: { delay: 6000, disableOnInteraction: false },
        effect: 'fade', fadeEffect: { crossFade: true },
        pagination: { el: '.hero-swiper .swiper-pagination', clickable: true },
        navigation: { nextEl: '.hero-swiper .swiper-button-next', prevEl: '.hero-swiper .swiper-button-prev' },
        on: { slideChangeTransitionStart: () => {
          el.querySelectorAll('[data-action]').forEach(btn => {
            btn.removeEventListener('click', btn._handler);
            btn._handler = () => {
              if (btn.dataset.action === 'watch') App.goWatch(btn.dataset.id);
              else App.goDetail(btn.dataset.id);
            };
            btn.addEventListener('click', btn._handler);
          });
        }},
      });
    }
  }

  return { render };
})();

window.Carousel = Carousel;
