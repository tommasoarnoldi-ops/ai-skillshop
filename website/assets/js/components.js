/* CENTAX — MUSA.AI landing: minimal header + full Centax footer (single-page) */
(function () {
  const SITE = 'https://www.cxcentax.com';
  const CONTACT = SITE + '/contatti/';
  const BOOKING = 'https://bookings.cloud.microsoft/book/Musa1@centaxtelecom.com/?ismsaljsauthenabled=true';

  document.getElementById('site-header').innerHTML = `
    <nav class="nav">
      <div class="nav__inner">
        <a class="nav__logo" href="${SITE}" aria-label="Centax">
          <img src="assets/img/centax-logo.png" alt="Centax" />
        </a>
        <div class="nav__menu">
          <a class="btn btn--primary nav__cta" href="${BOOKING}" target="_blank" rel="noopener">Prenota una demo</a>
        </div>
      </div>
    </nav>`;

  document.getElementById('site-footer').innerHTML = `
    <footer class="footer">
      <div class="container">
        <div class="footer__top">
          <div class="footer__brand">
            <img class="footer__logo" src="assets/img/centax-logo.png" alt="Centax" />
            <p>Customer Experience evoluta dall'AI. Human + AI: la tecnologia amplifica, le persone fanno la differenza.</p>
            <div class="footer__musa">
              <img src="assets/img/musa-logo.png" alt="MUSA" />
              <span>MUSA<b>.AI</b></span>
            </div>
            <div class="flex gap" style="margin-top:22px">
              <a class="btn btn--primary" href="${BOOKING}" target="_blank" rel="noopener">Prenota una demo</a>
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
        <div class="footer__legal">
          <p>© <span data-year></span> CX CENTAX S.r.l. Tutti i diritti riservati.</p>
          <p>C.F./P.IVA 02294000167 &nbsp;|&nbsp; CAP. SOC. EURO 50.000 I.V. &nbsp;–&nbsp; ISCR. TRIB. BG 47512 &nbsp;–&nbsp; REG. SOC. VOL. 46561 &nbsp;–&nbsp; REA 277834 &nbsp;–&nbsp; <a href="mailto:pec@pec.centaxtelecom.eu">pec@pec.centaxtelecom.eu</a></p>
        </div>
        <div class="footer__bottom">
          <span>MUSA.AI — un prodotto Centax</span>
          <div class="flex gap wrap">
            <a href="${SITE}" target="_blank" rel="noopener">www.cxcentax.com</a>
          </div>
        </div>
      </div>
    </footer>`;
})();
