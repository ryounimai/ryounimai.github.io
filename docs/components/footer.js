/**
 * components/footer.js — ŘΨØŬ v1.4.0
 */
const Footer = {
  init() {
    const el = document.getElementById('app-footer');
    if (!el) return;
    const year = new Date().getFullYear();
    el.innerHTML = `<p class="footer-text">© ${year} Ryounime.HS — ŘΨØŬ v1.4.0</p>`;
  }
};
window.Footer = Footer;
