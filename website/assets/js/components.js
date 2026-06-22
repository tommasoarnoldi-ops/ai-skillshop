/* CENTAX — MUSA.AI landing: minimal header & footer (single-page) */
(function () {
  const CONTACT = 'https://www.cxcentax.com/contatti/';
  const SITE = 'https://www.cxcentax.com';

  document.getElementById('site-header').innerHTML = `
    <nav class="nav">
      <div class="nav__inner">
        <a class="nav__logo" href="${SITE}" aria-label="Centax">
          <img src="assets/img/logo.svg" alt="Centax" />
        </a>
        <div class="nav__menu">
          <a class="btn btn--primary nav__cta" href="${CONTACT}">Richiedi una demo</a>
        </div>
      </div>
    </nav>`;

  document.getElementById('site-footer').innerHTML = `
    <footer class="footer">
      <div class="container">
        <div class="footer__top" style="grid-template-columns:1fr auto;align-items:center;gap:32px">
          <div class="footer__brand">
            <img src="assets/img/logo.svg" alt="Centax" style="height:30px" />
            <p>MUSA — l'AI che evolve il customer care. Human + AI: la tecnologia amplifica, le persone fanno la differenza.</p>
          </div>
          <a class="btn btn--primary" href="${CONTACT}">Richiedi una demo</a>
        </div>
        <div class="footer__bottom">
          <span>© <span data-year></span> Centax S.p.A. — Tutti i diritti riservati</span>
          <div class="flex gap wrap">
            <a href="${SITE}" target="_blank" rel="noopener">cxcentax.com</a>
          </div>
        </div>
      </div>
    </footer>`;
})();
