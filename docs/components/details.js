/**
 * components/details.js — ŘΨØŬ v2.0.3
 */
const Details = (() => {
  async function init(animeId) {
    const page = document.getElementById('detail-page');
    if (!page) return;
    page.classList.add('active');
    page.innerHTML = `<div class="main-wrap" style="padding-top:40px;text-align:center">${I18n.t('loading')}</div>`;

    try {
      const [libResp, epResp] = await Promise.all([API.library(), API.episodes(animeId)]);
      const anime = (libResp.data || []).find(a => a.id === animeId);
      if (!anime) throw new Error('Not found');
      _render(page, anime, epResp.episodes || []);
    } catch {
      page.innerHTML = `<div class="main-wrap" style="padding-top:40px;text-align:center">
        <p style="color:var(--txt-secondary)">${I18n.t('error_load')}</p>
        <button class="btn btn-outline" onclick="history.back()" style="margin-top:16px">&larr; Kembali</button>
      </div>`;
    }
  }

  function _render(page, anime, eps) {
    const title   = I18n.titleOf(anime);
    const titleAlt = anime.title_romaji || anime.title_ja || '';
    const desc    = I18n.descOf(anime) || '';
    const isManyEps = eps.length > 24;
    document.title = `${title} — ŘΨØŬ`;

    page.innerHTML = `
<!-- Hero -->
<div class="detail-hero" style="background-image:url('${anime.banner||anime.poster||''}')">
  <div class="detail-hero-ov"></div>
  <div class="detail-hero-content">
    <img class="detail-poster" src="${anime.poster||''}" alt="${title}" loading="lazy" onerror="this.style.display='none'">
    <div class="detail-info">
      <div class="detail-badges">
        <span class="badge-ryou badge-accent">${anime.type||'TV'}</span>
        <span class="badge-ryou badge-${anime.status==='Ongoing'?'success':'ghost'}">${anime.status==='Ongoing'?I18n.t('ongoing'):I18n.t('completed')}</span>
        ${anime.rating>0?`<span class="badge-ryou badge-warning">⭐ ${Number(anime.rating).toFixed(1)}</span>`:''}
        ${anime.year?`<span class="badge-ryou badge-ghost">${anime.year}</span>`:''}
      </div>
      <h1 class="detail-title">${title}</h1>
      ${titleAlt?`<div class="detail-title-alt">${titleAlt}</div>`:''}
      <div class="detail-genres-row">
        ${(anime.genres||[]).map(g=>`<span class="detail-genre-chip">${g}</span>`).join('')}
      </div>
      <div class="detail-actions">
        ${eps.length ? `<button class="btn btn-primary" id="btn-play-first">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          ${I18n.t('watch_now')}
        </button>` : ''}
        <button class="btn btn-outline" id="btn-back-home">← ${I18n.t('nav_home')}</button>
      </div>
    </div>
  </div>
</div>

<!-- Body -->
<div class="detail-body">
  ${desc ? `<div class="detail-section">
    <h2 class="detail-section-title">${I18n.t('synopsis')}</h2>
    <p class="detail-desc">${desc}</p>
  </div>` : ''}

  <!-- Info grid -->
  <div class="info-grid">
    ${_infoCell(I18n.t('type'),   anime.type||'—')}
    ${_infoCell(I18n.t('year'),   anime.year||'—')}
    ${_infoCell(I18n.t('status'), anime.status||'—')}
    ${_infoCell(I18n.t('studio'), anime.studio||'—')}
    ${_infoCell(I18n.t('episodes'), String(anime.episodes||eps.length||'—'))}
    ${_infoCell(I18n.t('aired'),  anime.aired||'—')}
    ${_infoCell(I18n.t('rating'), anime.rating>0?`⭐ ${Number(anime.rating).toFixed(1)}`:'—')}
    ${_infoCell(I18n.t('source'), anime.source||'—')}
  </div>

  <!-- Episode list -->
  ${eps.length ? `<div class="detail-section">
    <h2 class="detail-section-title">${I18n.t('episodes')} <span class="text-muted" style="font-weight:400;font-size:14px">(${eps.length})</span></h2>
    ${isManyEps ? `<div class="ep-num-grid">${_epNumGrid(anime, eps)}</div>` : `<div class="ep-list">${_epCards(anime, eps)}</div>`}
  </div>` : ''}
</div>`;

    // Bind
    document.getElementById('btn-play-first')?.addEventListener('click', () => App.goWatch(anime.id, eps[0]?.ep || 1));
    document.getElementById('btn-back-home')?.addEventListener('click', () => App.goHome());

    if (isManyEps) {
      page.querySelectorAll('.ep-num-chip').forEach(chip => {
        chip.addEventListener('click', () => App.goWatch(anime.id, +chip.dataset.ep));
      });
    } else {
      page.querySelectorAll('.ep-card').forEach(card => {
        card.addEventListener('click', () => App.goWatch(anime.id, +card.dataset.ep));
      });
    }
  }

  function _infoCell(label, val) {
    return `<div class="info-cell"><div class="info-cell-label">${label}</div><div class="info-cell-value">${val}</div></div>`;
  }

  function _epCards(anime, eps) {
    return eps.map(ep => {
      const pct = Store.Continue.getPct(anime.id, ep.ep);
      return `<div class="ep-card" data-ep="${ep.ep}">
  <div class="ep-thumb">
    <img src="${ep.thumbnail||anime.poster||''}" alt="EP${ep.ep}" loading="lazy" onerror="this.style.display='none'">
    <div class="ep-thumb-play">▶</div>
    ${pct>0?`<div class="ep-thumb-progress" style="width:${pct}%"></div>`:''}
  </div>
  <div class="ep-body">
    <div class="ep-num">${I18n.t('ep_short')} ${ep.ep}</div>
    <div class="ep-title">${ep.title&&ep.title!=='Play Now'?ep.title:`${I18n.t('episode')} ${ep.ep}`}</div>
    ${ep.duration&&ep.duration!=='—'?`<div class="ep-dur">${ep.duration}</div>`:''}
  </div>
</div>`;
    }).join('');
  }

  function _epNumGrid(anime, eps) {
    return eps.map(ep => {
      const played = Store.History.has(anime.id, ep.ep);
      return `<div class="ep-num-chip${played?' played':''}" data-ep="${ep.ep}">${ep.ep}</div>`;
    }).join('');
  }

  return { init };
})();

window.Details = Details;
