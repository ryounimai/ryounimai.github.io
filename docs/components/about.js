/**
 * components/about.js — ŘΨØŬ v2.0.1
 * About page + Changelog accordion
 */
const AboutComp = {
  /* Changelog — sync dengan changelogs.md di root */
  _changelogs: [
    {
      version: 'v2.0.1',
      date: '2026-04-12',
      tag: 'latest',
      open: true,
      changes: [
        'Fix: floating tooltip/time/volume box squished 2px — hapus line-height:0 warisan Video.js',
        'Fix: vds-time tidak terlihat — tambah class .dark + --media-time-color eksplisit',
        'Feature: Autoplay next episode dengan overlay countdown 3 detik',
        'Feature: Tombol Putar Sekarang & Batal di overlay next episode',
        'Update about page: info teknologi diperbarui (Vidstack, media-icons, DASH format)',
      ]
    },
        {
      version: 'v2.0.0',
      date: '2026-04-12',
      tag: 'stable',
      open: false,
      changes: [
        'REBORN: Migrasi player dari Video.js ke Vidstack v1.12.13 (Web Components)',
        'Hapus semua Video.js (video.min.js 672KB, video-js.min.css 47KB, lang files)',
        'Install Vidstack offline penuh: core, default layout, providers, icons',
        'Buat icons.js lokal dari media-icons v0.10.0 (104 ikon, tanpa CDN)',
        'Patch vidstack.js — ganti cdn.vidstack.io/icons ke lokal',
        'Rombak total watch.js: pakai Vidstack Web Components API',
        'Rombak total player.css: Vidstack CSS vars theming, brand #22d3ee',
        'Quality selector sekarang built-in dari Vidstack default layout',
        'Subtitle, HLS/DASH/MP4 support, autoplay next, resume progress tetap terjaga',
        'Naik versi: v2.0.0 Reborn',
      ]
    },
        {
      version: 'v2.0.0',
      date: '2026-04-12',
      tag: 'stable',
      open: false,
      changes: [
        'Fix: versi di about diambil dari backend API bukan frontend — ganti ke frontend-only',
        'Fix: entry v1.0.0 changelog salah tulis "Rilis pertama v1.4.0"',
        'Tambah font JetBrains Mono offline (woff2, latin subset)',
        'Semua versi angka pakai font mono + letter-spacing rapat (.ver class)',
        'Update deskripsi & kredit di about page',
        'Hapus referensi platform spesifik dari deskripsi & kredit',
      ]
    },
    {
      version: 'v1.4.0',
      date: '2026-04-12',
      tag: 'stable',
      open: false,
      changes: [
        'Fix: watch page kosong — videojs.extend() dihapus di VJS 8, ganti ke ES6 class',
        'Fix: overflow:hidden pada control-bar & watch-player-box halangi menu speed & CC',
        'Fix: CC/subtitle button tampil sebagai garis biru (indikator aktif VJS 8)',
        'Fix: jarak waktu & speed tabrakan saat durasi lebih dari 1 jam',
        'Fix: volume slider meluap ke atas',
        'Fix: hamburger X tidak bisa diklik untuk tutup drawer',
        'Fix: backdrop z-index nutupin hamburger di beberapa device',
        'Hapus teks ŘΨØŬ duplikat di splash & about',
        'Bersihkan komentar redundan di watch.js, index.js, player.css',
      ]
    },
    {
      version: 'v1.0.1',
      date: '2026-04-11',
      tag: 'old',
      open: false,
      changes: [
        'Fix: carousel pagination dot gelap',
        'Fix: next episode gagal karena videojs.dispose() hapus elemen dari DOM',
        'Fix: episode selector klik tidak respon — diganti event delegation',
        'Fix: judul tampil sebagai folder name (titleOf prioritas terbalik)',
        'Changelog about page: format accordion expand/collapse',
      ]
    },
    {
      version: 'v1.0.0',
      date: '2026-04-10',
      tag: 'initial',
      open: false,
      changes: [
        'Rilis pertama ŘΨØŬ v2.0.1',
        'Frontend: HTML + Vanilla JS + Bootstrap 5 + Swiper + Video.js 8',
        'Backend: Python stdlib only',
        'Metadata: integrasi Jikan (MAL), TMDB, MDL',
        'PWA: manifest + service worker + offline cache',
        'Multi bahasa: ID, EN, JA',
        'Fitur: lanjut nonton, riwayat, autoplay next episode',
        'Player: HLS, DASH, MP4, MKV support',
        'Subtitle: VTT, SRT, ASS/SSA',
      ]
    },
  ],

  _tagStyle(tag) {
    const map = {
      latest : { bg:'rgba(34,211,238,.12)', color:'var(--clr-accent)',  border:'var(--clr-accent)' },
      stable : { bg:'rgba(168,85,247,.12)', color:'#a855f7',            border:'#a855f7' },
      old    : { bg:'rgba(255,255,255,.05)', color:'var(--txt-tertiary)', border:'var(--bdr-subtle)' },
      initial: { bg:'rgba(34,197,94,.12)',  color:'var(--clr-success)', border:'var(--clr-success)' },
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

    /* bind toggle */
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
    /* Versi frontend — tidak pakai API.settings() agar tidak override */
    const vEl = document.getElementById('about-version');
    if (vEl) vEl.textContent = 'v2.0.1';
    this._renderChangelogs();
  }
};
window.AboutComp = AboutComp;
