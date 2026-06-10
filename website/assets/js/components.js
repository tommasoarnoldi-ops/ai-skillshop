/* CENTAX — shared header & footer injected once, consistent across pages */
(function () {
  const page = document.body.dataset.page || '';
  const nav = [
    { href: 'chi-siamo.html', label: 'Chi siamo', key: 'chi-siamo' },
    { href: 'cosa-facciamo.html', label: 'Cosa facciamo', key: 'cosa-facciamo' },
    { href: 'perche-cx.html', label: 'Perché CX', key: 'perche-cx' },
    { href: 'valori.html', label: 'Valori', key: 'valori' },
    { href: 'cx-lab.html', label: 'CX Lab', key: 'cx-lab' },
    { href: 'musa.html', label: 'MUSA', key: 'musa', musa: true },
    { href: 'news.html', label: 'News', key: 'news' },
    { href: 'lavora-con-noi.html', label: 'Lavora con noi', key: 'lavora' },
  ];

  const links = nav
    .map(
      (n) =>
        `<a class="nav__link ${n.musa ? 'nav__link--musa' : ''} ${page === n.key ? 'is-active' : ''}" href="${n.href}">${n.label}</a>`
    )
    .join('');

  document.getElementById('site-header').innerHTML = `
    <nav class="nav">
      <div class="nav__inner">
        <a class="nav__logo" href="index.html" aria-label="Centax — home">
          <img src="assets/img/logo.svg" alt="Centax" />
        </a>
        <div class="nav__menu">
          ${links}
          <a class="btn btn--primary nav__cta" href="contatti.html">Contattaci</a>
        </div>
        <button class="nav__burger" aria-label="Menu"><span></span><span></span><span></span></button>
      </div>
    </nav>`;

  document.getElementById('site-footer').innerHTML = `
    <footer class="footer">
      <div class="container">
        <div class="footer__top">
          <div class="footer__brand">
            <img src="assets/img/logo.svg" alt="Centax" style="height:30px" />
            <p>Trentennale esperienza nella Customer Experience. Persone, tecnologia e AI al servizio di relazioni che generano valore.</p>
            <div class="flex gap" style="margin-top:24px">
              <a class="btn btn--primary" href="musa.html">Scopri MUSA <span class="ico">→</span></a>
            </div>
          </div>
          <div class="footer__col">
            <h4>Azienda</h4>
            <a href="chi-siamo.html">Chi siamo</a>
            <a href="valori.html">Valori</a>
            <a href="perche-cx.html">Perché Centax</a>
            <a href="lavora-con-noi.html">Lavora con noi</a>
          </div>
          <div class="footer__col">
            <h4>Soluzioni</h4>
            <a href="cosa-facciamo.html">Cosa facciamo</a>
            <a href="musa.html">MUSA — AI Platform</a>
            <a href="cx-lab.html">CX Lab</a>
            <a href="news.html">News</a>
          </div>
          <div class="footer__col">
            <h4>Contatti</h4>
            <a href="contatti.html">Scrivici</a>
            <a href="mailto:info@cxcentax.com">info@cxcentax.com</a>
            <a href="https://www.cxcentax.com" target="_blank" rel="noopener">www.cxcentax.com</a>
          </div>
        </div>
        <div class="footer__bottom">
          <span>© <span data-year></span> Centax S.p.A. — Tutti i diritti riservati</span>
          <div class="flex gap wrap">
            <a href="#">Privacy Policy</a>
            <a href="#">Cookie Policy</a>
            <a href="#">Whistleblowing</a>
          </div>
        </div>
      </div>
    </footer>`;
})();
