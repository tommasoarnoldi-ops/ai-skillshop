/* CENTAX — MUSA.AI landing: minimal header + full Centax footer (single-page) */
(function () {
  const SITE = 'https://www.cxcentax.com';
  const CONTACT = SITE + '/contatti/';

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
        <div class="footer__top">
          <div class="footer__brand">
            <img src="assets/img/logo.svg" alt="Centax" style="height:30px" />
            <p>Customer Experience evoluta dall'AI. Human + AI: la tecnologia amplifica, le persone fanno la differenza.</p>
            <div class="flex gap" style="margin-top:24px">
              <a class="btn btn--primary" href="${CONTACT}">Richiedi una demo</a>
            </div>
          </div>
          <div class="footer__col">
            <h4>Azienda</h4>
            <a href="${SITE}/chi-siamo/">Chi siamo</a>
            <a href="${SITE}/valori/">Valori</a>
            <a href="${SITE}/perche-scegliere-cx/">Perché scegliere CX</a>
            <a href="${SITE}/lavora-con-noi/">Lavora con noi</a>
          </div>
          <div class="footer__col">
            <h4>Cosa facciamo</h4>
            <a href="${SITE}/cosa-facciamo/">Cosa facciamo</a>
            <a href="index.html">MUSA.AI</a>
            <a href="${SITE}/cx-lab/">CX Lab</a>
            <a href="${SITE}/news/">News</a>
          </div>
          <div class="footer__col">
            <h4>Contatti &amp; Legale</h4>
            <a href="${CONTACT}">Contatti</a>
            <a href="${SITE}/privacy-policy/">Privacy Policy</a>
            <a href="${SITE}/cookie-policy/">Cookie Policy</a>
            <a href="${SITE}/whistleblowing/">Whistleblowing</a>
            <a href="${SITE}/privacy-policy-candidati/">Privacy Policy Candidati</a>
          </div>
        </div>
        <div class="footer__bottom">
          <span>© <span data-year></span> Centax S.p.A. — Tutti i diritti riservati</span>
          <div class="flex gap wrap">
            <a href="${SITE}" target="_blank" rel="noopener">www.cxcentax.com</a>
          </div>
        </div>
      </div>
    </footer>`;
})();
