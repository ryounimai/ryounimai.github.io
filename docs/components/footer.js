/**
 * components/footer.js — ŘΨØŬ v3.0.0
 */
const Footer = {
  init() {
    const el = document.getElementById('app-footer');
    if (!el) return;
    const year = new Date().getFullYear();
    el.innerHTML = `<p class="footer-text">© ${year} Ryounime.HS — ŘΨØŬ <span class="ver">v3.0.0</span></p>`;
  }
};
window.Footer = Footer;
