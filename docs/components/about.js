/**
 * components/about.js — ŘΨØŬ v1.4.0
 * About page + Changelog accordion
 */
const AboutComp = {
  /* Changelog — sync dengan changelogs.md di root */
  _changelogs: [
    {
      version: 'v1.4.0',
      date: '2026-04-12',
      tag: 'latest',
      open: true,
      changes: [
        'Fix: watch page kosong — videojs.extend() dihapus di VJS 8, ganti ke ES6 class',
        'Fix: overflow:hidden pada control-bar & watch-player-box halangi menu speed & CC',
        'Fix: GearButton membuka subtitle settings bukan quality — dihapus sementara (TODO: quality selector)',
        'Fix: CC/subtitle button tampil sebagai garis biru (indikator aktif VJS 8 disembunyikan)',
        'Fix: jarak waktu & speed tabrakan saat durasi lebih dari 1 jam',
        'Fix: volume slider meluap ke atas — overflow:visible + inline panel fix',
        'Fix: hamburger X tidak bisa diklik untuk tutup drawer (hanya bind openDrawer, tidak toggle)',
        'Fix: backdrop z-index terlalu mepet navbar, bisa nutupin hamburger di beberapa device',
        'Fix: preload bar terlalu mencolok — opacity dikurangi',
        'Improvement: remaining-time lebar konten, gap ke speed fixed 8px',
        'Improvement: letter-spacing digit waktu diperapat, hemat ruang mobile',
        'Hapus dead CSS vjs-gear-button (3 selector)',
        'Fix: about.html version span hardcode v1.0.1 → v1.4.0',
        'Hapus teks ŘΨØŬ di splash & about — logo.svg sudah mewakili',
        'Bersihkan komentar redundan di watch.js, index.js, player.css',
      ]
    },
    {
      version: 'v1.0.1',
      date: '2026-04-11',
      tag: 'stable',
      open: false,
      changes: [
        'Fix: gap kosong di watch page portrait (remove overflow:hidden + min-height layout)',
        'Fix: carousel pagination dot gelap (Swiper inactive bullet warna #000 default)',
        'Fix: next episode gagal karena videojs.dispose() hapus elemen dari DOM',
        'Fix: episode selector klik tidak respon — diganti event delegation',
        'Fix: video blank saat ganti episode',
        'Fix: gap kosong sebelum/sesudah video di watch page',
        'Fix: judul tampil sebagai folder name (titleOf prioritas terbalik)',
        'Versi sync ke v1.0.1 di semua halaman',
        'Changelog about page: format accordion expand/collapse',
      ]
    },
    {
      version: 'v1.0.0',
      date: '2026-04-10',
      tag: 'initial',
      open: false,
      changes: [
        'Rilis pertama ŘΨØŬ v1.4.0',
        'Frontend: HTML + Vanilla JS + Bootstrap 5 + Swiper + Video.js 8',
        'Backend: Python stdlib only, tidak perlu install dependency eksternal',
        'Metadata: integrasi Jikan (MAL), TMDB, MDL',
        'PWA: manifest + service worker + offline cache',
        'Multi bahasa: ID, EN, JA',
        'Fitur: lanjut nonton, riwayat, autoplay next episode',
        'Player: HLS, DASH, MP4, MKV support',
        'Subtitle: VTT, SRT, ASS/SSA',
        'CSS: rekonstruksi player.css & Swiper pakai native CSS vars',
        'Admin lock: tombol scan/clear dikunci PIN',
        'Logo navbar: hapus teks nama, pakai SVG saja',
      ]
    },
  ],

  _tagStyle(tag) {
    const map = {
      latest : { bg:'rgba(34,211,238,.12)', color:'var(--clr-accent)',   border:'var(--clr-accent)' },
      stable : { bg:'rgba(168,85,247,.12)', color:'#a855f7',             border:'#a855f7' },
      initial: { bg:'rgba(34,197,94,.12)',  color:'var(--clr-success)',  border:'var(--clr-success)' },
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
    <span style="font-size:var(--font-size-md);font-weight:800;color:var(--txt-primary)">${log.version}</span>
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
    let version = 'v1.4.0';
    try { const s = await API.settings(); version = s.version || version; } catch {}
    const vEl = document.getElementById('about-version');
    if (vEl) vEl.textContent = version;
    this._renderChangelogs();
  }
};
window.AboutComp = AboutComp;
