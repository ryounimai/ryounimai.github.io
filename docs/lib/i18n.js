/**
 * lib/i18n.js — ŘΨØŬ v2.0.3
 * Internasionalisasi ID / EN / JA
 */
const I18n = (() => {
  const strings = {
    id: {
      app_name:'ŘΨØŬ', search_placeholder:'Cari judul...', nav_home:'Beranda',
      nav_history:'Riwayat', nav_settings:'Pengaturan', nav_about:'Tentang',
      continue_watching:'Lanjut Nonton', trending:'Sedang Trending',
      top_series:'Top Series', top_movies:'Top Film',
      all_titles:'Semua Judul', all_series:'Semua Serial', all_movies:'Semua Film',
      loading:'Memuat...', scanning:'Sedang scan library...',
      scan_empty:'Library kosong. Coba scan ulang.',
      no_results:'Tidak ditemukan', retry:'Coba Lagi',
      play:'Putar', play_ep:'Putar EP', watch_now:'Tonton Sekarang',
      back_to_info:'Info', prev_ep:'‹ Sebelumnya', next_ep:'Berikutnya ›',
      episode:'Episode', episodes:'Episode', duration:'Durasi',
      synopsis:'Sinopsis', info:'Informasi', genres:'Genre',
      type:'Tipe', year:'Tahun', status:'Status', studio:'Studio',
      rating:'Rating', aired:'Tayang', source:'Sumber',
      ongoing:'Sedang Tayang', completed:'Selesai',
      settings:'Pengaturan', settings_lang:'Bahasa', settings_autoplay:'Autoplay next',
      settings_subtitle:'Aktifkan subtitle', settings_scan:'Scan Library',
      settings_force_scan:'Scan Ulang (paksa)', settings_clear_cache:'Hapus Cache',
      settings_clear_lib:'Hapus Cache Library', settings_clear_all:'Hapus Semua Cache',
      settings_version:'Versi', settings_path:'Path SD Card',
      settings_scanning:'Sedang scan...', settings_scan_done:'Scan selesai!',
      settings_cache_cleared:'Cache dihapus.',
      history:'Riwayat Tontonan', history_empty:'Belum ada riwayat.',
      history_clear:'Hapus Semua', confirm_clear:'Yakin menghapus semua?',
      filter:'Filter', filter_all:'Semua', filter_type:'Tipe', filter_genre:'Genre',
      filter_year:'Tahun', filter_status:'Status', filter_apply:'Terapkan',
      filter_reset:'Reset', filter_active:'Filter aktif',
      ep_short:'EP', ep_watched:'Ditonton', ep_playing:'Sedang diputar',
      about_desc:'Pemutar media anime & drama lokal berbasis web',
      about_tech:'Teknologi', about_credits:'Kredit',
      toast_scan_started:'Scan library dimulai...', toast_scan_done:'Scan selesai!',
      toast_cache_done:'Cache dihapus.', toast_error:'Terjadi kesalahan',
      error_load:'Gagal memuat. Periksa koneksi ke server.',
      error_video:'Video tidak dapat diputar.',
    },
    en: {
      app_name:'ŘΨØŬ', search_placeholder:'Search titles...', nav_home:'Home',
      nav_history:'History', nav_settings:'Settings', nav_about:'About',
      continue_watching:'Continue Watching', trending:'Trending Now',
      top_series:'Top Series', top_movies:'Top Movies',
      all_titles:'All Titles', all_series:'All Series', all_movies:'All Movies',
      loading:'Loading...', scanning:'Scanning library...',
      scan_empty:'Library is empty. Try scanning.', no_results:'Not found', retry:'Retry',
      play:'Play', play_ep:'Play EP', watch_now:'Watch Now',
      back_to_info:'Info', prev_ep:'‹ Previous', next_ep:'Next ›',
      episode:'Episode', episodes:'Episodes', duration:'Duration',
      synopsis:'Synopsis', info:'Info', genres:'Genres',
      type:'Type', year:'Year', status:'Status', studio:'Studio',
      rating:'Rating', aired:'Aired', source:'Source',
      ongoing:'Ongoing', completed:'Completed',
      settings:'Settings', settings_lang:'Language', settings_autoplay:'Autoplay next',
      settings_subtitle:'Enable subtitles', settings_scan:'Scan Library',
      settings_force_scan:'Force Rescan', settings_clear_cache:'Clear Cache',
      settings_clear_lib:'Clear Library Cache', settings_clear_all:'Clear All Cache',
      settings_version:'Version', settings_path:'SD Card Path',
      settings_scanning:'Scanning...', settings_scan_done:'Scan complete!',
      settings_cache_cleared:'Cache cleared.',
      history:'Watch History', history_empty:'No history yet.',
      history_clear:'Clear All', confirm_clear:'Clear everything?',
      filter:'Filter', filter_all:'All', filter_type:'Type', filter_genre:'Genre',
      filter_year:'Year', filter_status:'Status', filter_apply:'Apply',
      filter_reset:'Reset', filter_active:'Active filters',
      ep_short:'EP', ep_watched:'Watched', ep_playing:'Now playing',
      about_desc:'Local anime & drama media player, web-based',
      about_tech:'Tech Stack', about_credits:'Credits',
      toast_scan_started:'Library scan started...', toast_scan_done:'Scan complete!',
      toast_cache_done:'Cache cleared.', toast_error:'An error occurred',
      error_load:'Failed to load. Check server connection.',
      error_video:'Cannot play this video.',
    },
    ja: {
      app_name:'ŘΨØŬ', search_placeholder:'タイトルを検索...', nav_home:'ホーム',
      nav_history:'履歴', nav_settings:'設定', nav_about:'について',
      continue_watching:'続きを見る', trending:'トレンド中',
      top_series:'トップシリーズ', top_movies:'トップ映画',
      all_titles:'全タイトル', all_series:'全シリーズ', all_movies:'全映画',
      loading:'読み込み中...', scanning:'ライブラリをスキャン中...',
      scan_empty:'ライブラリが空です。スキャンしてください。',
      no_results:'見つかりません', retry:'再試行',
      play:'再生', play_ep:'EP再生', watch_now:'今すぐ見る',
      back_to_info:'情報', prev_ep:'‹ 前へ', next_ep:'次へ ›',
      episode:'エピソード', episodes:'エピソード', duration:'時間',
      synopsis:'あらすじ', info:'情報', genres:'ジャンル',
      type:'タイプ', year:'年', status:'状態', studio:'スタジオ',
      rating:'評価', aired:'放送', source:'ソース',
      ongoing:'放送中', completed:'完結',
      settings:'設定', settings_lang:'言語', settings_autoplay:'自動再生',
      settings_subtitle:'字幕を有効化', settings_scan:'スキャン',
      settings_force_scan:'強制再スキャン', settings_clear_cache:'キャッシュ削除',
      settings_clear_lib:'ライブラリキャッシュ削除', settings_clear_all:'全キャッシュ削除',
      settings_version:'バージョン', settings_path:'SDカードパス',
      settings_scanning:'スキャン中...', settings_scan_done:'スキャン完了!',
      settings_cache_cleared:'キャッシュを削除しました。',
      history:'視聴履歴', history_empty:'履歴はありません。',
      history_clear:'全削除', confirm_clear:'全て削除しますか？',
      filter:'フィルター', filter_all:'全て', filter_type:'タイプ', filter_genre:'ジャンル',
      filter_year:'年', filter_status:'状態', filter_apply:'適用', filter_reset:'リセット',
      filter_active:'フィルター中',
      ep_short:'EP', ep_watched:'視聴済み', ep_playing:'再生中',
      about_desc:'ローカルアニメ・ドラマウェブメディアプレイヤー',
      about_tech:'技術スタック', about_credits:'クレジット',
      toast_scan_started:'スキャン開始...', toast_scan_done:'スキャン完了!',
      toast_cache_done:'キャッシュ削除済み。', toast_error:'エラーが発生しました',
      error_load:'読み込み失敗。サーバー接続を確認してください。',
      error_video:'動画を再生できません。',
    },
  };

  let _lang = Store?.Settings?.get()?.lang || 'id';

  function t(key) { return (strings[_lang] || strings.id)[key] || strings.id[key] || key; }
  function setLang(lang) {
    if (!strings[lang]) return;
    _lang = lang;
    Store?.Settings?.set('lang', lang);
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const k = el.dataset.i18n;
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.placeholder = t(k);
      else el.textContent = t(k);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = t(el.dataset.i18nPlaceholder);
    });
    document.dispatchEvent(new CustomEvent('langchange', { detail: lang }));
  }
  function lang() { return _lang; }
  function titleOf(item) {
    if (!item) return '';
    if (_lang === 'ja') return item.title_ja || item.title_romaji || item.title;
    if (_lang === 'en') return item.title_en || item.title;
    // id: prefer metadata title (cleaned proper name), fall back to title_local (folder)
    return item.title || item.title_local;
  }
  function descOf(item) {
    if (!item) return '';
    if (_lang === 'ja') return item.description_ja || item.description_id || item.description;
    if (_lang === 'en') return item.description || item.description_id;
    return item.description_id || item.description;
  }

  return { t, setLang, lang, titleOf, descOf };
})();

window.I18n = I18n;
