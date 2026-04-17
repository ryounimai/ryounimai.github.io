/**
 * components/about.js — ŘΨØŬ v3.0.0
 * About page + Changelog
 */
const AboutComp = {
  _changelogs: [
    {
      version: 'v2.1.0',
      date: '2026-04-13',
      tag: 'final',
      open: true,
      changes: [
        'Rilis final ŘΨØŬ — pembaruan mendatang tidak akan dalam waktu dekat',
        'Changelogs dibersihkan, entri lama dihapus',
        'Tag versi disederhanakan',
        'Settings panel dirancang ulang',
      ]
    },
    {
      version: 'v2.0.x',
      date: '2026-04-12',
      tag: 'legacy',
      open: false,
      changes: [
        'v2.0.3 — Ganti bahasa otomatis reload halaman',
        'v2.0.2 — Fix notch fullscreen asimetris, overlay next ep di fullscreen, portrait sticky',
        'v2.0.1 — Fix floating box squished, autoplay next + overlay countdown 3s',
        'v2.0.0 — Reborn: migrasi player Video.js → Vidstack v1.12.13 (offline penuh)',
      ]
    },
    {
      version: 'v1.x',
      date: '2026-04-10',
      tag: 'legacy',
      open: false,
      changes: [
        'v1.4.x — Fix watch page, player CSS, hamburger, volume, time display',
        'v1.0.x — Rilis awal ŘΨØŬ: Vidstack, Bootstrap, Swiper, PWA, multi-bahasa',
      ]
    },
  ],

  _tagStyle(tag) {
    const map = {
      final : { bg:'rgba(239,68,68,.12)',   color:'#ef4444',           border:'#ef4444' },
      legacy: { bg:'rgba(255,255,255,.05)', color:'var(--txt-tertiary)', border:'var(--bdr-subtle)' },
    };
    const s = map[tag] || { bg:'var(--bg-float)', color:'var(--txt-secondary)', border:'var(--bdr-subtle)' };
    return `background:${s.bg};color:${s.color};border:1px solid ${s.border}`;
  },

  _renderChangelogs() {
    const el = document.getElementById('changelog-list');
    if (!el) return;

    el.innerHTML = this._changelogs.map((log, i) => `
<div class="cl-item" style="border:1px solid var(--bdr-subtle);border-radius:var(--r-md);overflow:hidden">
  <button class="cl-toggle" data-idx="${i}"
    style="width:100%;display:flex;align-items:center;gap:10px;padding:14px 16px;
           background:var(--srf-01);border:none;cursor:pointer;text-align:left;transition:background .15s">
    <svg class="cl-chevron" data-idx="${i}" width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" stroke-width="2.5"
      style="flex-shrink:0;transition:transform .2s;transform:${log.open ? 'rotate(90deg)' : 'rotate(0deg)'}">
      <path d="M9 18l6-6-6-6"/>
    </svg>
    <span style="font-size:var(--font-size-md);font-weight:800;color:var(--txt-primary)" class="ver">${log.version}</span>
    <span style="font-size:10px;padding:2px 8px;border-radius:var(--r-pill);font-weight:700;
      text-transform:uppercase;${this._tagStyle(log.tag)}">${log.tag}</span>
    <span style="font-size:var(--font-size-xs);color:var(--txt-tertiary);margin-left:auto">${log.date}</span>
  </button>
  <div class="cl-body" data-idx="${i}"
    style="overflow:hidden;transition:max-height .25s ease,padding .25s;
           max-height:${log.open ? '1000px' : '0'};padding:${log.open ? '12px 16px 16px' : '0 16px'}">
    <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:6px">
      ${log.changes.map(ch =>
        `<li style="font-size:var(--font-size-sm);color:var(--txt-secondary);display:flex;gap:8px;align-items:flex-start">
          <span style="color:var(--clr-accent);flex-shrink:0;margin-top:1px">›</span>
          <span>${ch}</span>
        </li>`
      ).join('')}
    </ul>
  </div>
</div>`).join('');

    el.querySelectorAll('.cl-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx  = +btn.dataset.idx;
        const body = el.querySelector(`.cl-body[data-idx="${idx}"]`);
        const chev = el.querySelector(`.cl-chevron[data-idx="${idx}"]`);
        const isOpen = body.style.maxHeight !== '0px' && body.style.maxHeight !== '0';
        if (isOpen) {
          body.style.maxHeight = '0';
          body.style.padding   = '0 16px';
          chev.style.transform = 'rotate(0deg)';
        } else {
          body.style.maxHeight = '1000px';
          body.style.padding   = '12px 16px 16px';
          chev.style.transform = 'rotate(90deg)';
        }
      });
    });
  },

  async init() {
    const page = document.getElementById('about-page');
    if (!page) return;
    page.classList.add('active');
    const vEl = document.getElementById('about-version');
    if (vEl) vEl.textContent = 'v3.0.0';
    this._renderChangelogs();

    /* Phase 7: scroll-triggered untuk stack-card dan changelog items */
    requestAnimationFrame(() => {
      Anim.onEnter('.stack-card', el => Anim.fadeUp(el, { duration: 260, from: 10 }));
      Anim.onEnter('.cl-item',    el => Anim.fadeUp(el, { duration: 220, from: 8  }));
    });
  }
};
window.AboutComp = AboutComp;
