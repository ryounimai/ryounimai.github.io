/**
 * components/footer.js — ŘΨØŬ v2.0.3
 */
const Footer = {
  init() {
    const el = document.getElementById('app-footer');
    if (!el) return;
    const year = new Date().getFullYear();
    el.innerHTML = `<p class="footer-text">© ${year} Ryounime.HS — ŘΨØŬ <span class="ver">v2.0.3</span></p>`;
  }
};
window.Footer = Footer;
