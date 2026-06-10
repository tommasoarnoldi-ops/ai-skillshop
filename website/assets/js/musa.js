/* MUSA — premium page interactions (loaded only on musa.html) */
(function () {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(pointer:fine)').matches;
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.prototype.slice.call((c || document).querySelectorAll(s));

  /* ===== Inject language switch into the navbar (page-only) ===== */
  (function injectLang() {
    const menu = $('.nav__menu');
    if (!menu) return;
    const sw = document.createElement('div');
    sw.className = 'lang-switch';
    sw.innerHTML =
      '<button class="lang-btn active" data-set-lang="it" type="button">IT</button>' +
      '<span>·</span>' +
      '<button class="lang-btn" data-set-lang="en" type="button">EN</button>';
    const cta = menu.querySelector('.nav__cta');
    menu.insertBefore(sw, cta || null);
  })();

  /* ===== Preloader ===== */
  const pre = $('[data-preloader]');
  if (pre) {
    const fill = $('.preloader__track i', pre);
    const pct = $('[data-pre-pct]');
    let p = 0;
    const tick = () => {
      p = Math.min(100, p + Math.random() * 18 + 6);
      if (fill) fill.style.width = p + '%';
      if (pct) pct.textContent = Math.round(p) + '%';
      if (p < 100) setTimeout(tick, 130);
      else setTimeout(() => pre.classList.add('done'), 350);
    };
    if (reduce) pre.classList.add('done');
    else setTimeout(tick, 150);
  }

  /* ===== Scroll progress ===== */
  const bar = $('.scrollbar');
  const onScrollBar = () => {
    if (!bar) return;
    const h = document.documentElement;
    bar.style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight || 1) * 100).toFixed(2) + '%';
  };
  window.addEventListener('scroll', onScrollBar, { passive: true });
  onScrollBar();

  /* ===== Spotlight ===== */
  if (fine) {
    $$('.spot').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', ((e.clientX - r.left) / r.width) * 100 + '%');
        el.style.setProperty('--my', ((e.clientY - r.top) / r.height) * 100 + '%');
      });
    });
  }

  /* ===== Magnetic buttons ===== */
  if (fine && !reduce) {
    $$('[data-magnetic]').forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        btn.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.22}px,${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
      });
      btn.addEventListener('mouseleave', () => (btn.style.transform = ''));
    });
  }

  /* ===== Tabs ===== */
  $$('[data-tabs]').forEach((group) => {
    const btns = $$('.tabs__btn', group);
    const panels = $$('.tabs__panel', group);
    btns.forEach((b) =>
      b.addEventListener('click', () => {
        btns.forEach((x) => x.classList.remove('active'));
        panels.forEach((x) => x.classList.remove('active'));
        b.classList.add('active');
        const t = group.querySelector('#' + b.dataset.target);
        if (t) t.classList.add('active');
      })
    );
  });

  /* ===== Parallax + pinned statement ===== */
  const paras = $$('[data-parallax]');
  const stage = $('[data-pin-stage]');
  const words = $$('[data-pin-word]');
  const onScroll = () => {
    const y = window.scrollY;
    if (!reduce) paras.forEach((el) => (el.style.transform = `translateY(${(y * parseFloat(el.dataset.parallax)).toFixed(1)}px)`));
    if (stage && words.length && window.innerWidth > 980) {
      const r = stage.getBoundingClientRect();
      const total = stage.offsetHeight - window.innerHeight;
      const prog = Math.min(1, Math.max(0, -r.top / (total || 1)));
      const idx = Math.min(words.length - 1, Math.floor(prog * words.length));
      words.forEach((w, i) => w.classList.toggle('on', i === idx));
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  if (words[0] && window.innerWidth > 980) words[0].classList.add('on');
  onScroll();

  /* ===== Hero particle network ===== */
  const canvas = $('[data-particles]');
  if (canvas && !reduce) {
    const ctx = canvas.getContext('2d');
    let w, h, pts, mouse = { x: -999, y: -999 }, raf;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const init = () => {
      w = canvas.width = canvas.offsetWidth * dpr;
      h = canvas.height = canvas.offsetHeight * dpr;
      const n = Math.min(70, Math.floor(canvas.offsetWidth / 22));
      pts = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35 * dpr, vy: (Math.random() - 0.5) * 0.35 * dpr,
      }));
    };
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.6 * dpr, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(248,233,0,.55)';
        ctx.fill();
        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j], dx = p.x - q.x, dy = p.y - q.y, d = Math.hypot(dx, dy);
          if (d < 130 * dpr) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(248,233,0,${0.14 * (1 - d / (130 * dpr))})`;
            ctx.lineWidth = dpr;
            ctx.stroke();
          }
        }
        const mdx = p.x - mouse.x, mdy = p.y - mouse.y, md = Math.hypot(mdx, mdy);
        if (md < 150 * dpr) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(255,255,255,${0.18 * (1 - md / (150 * dpr))})`;
          ctx.lineWidth = dpr;
          ctx.stroke();
        }
      }
      raf = requestAnimationFrame(draw);
    };
    const start = () => { cancelAnimationFrame(raf); init(); draw(); };
    window.addEventListener('resize', start);
    if (fine) canvas.addEventListener('mousemove', (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - r.left) * dpr; mouse.y = (e.clientY - r.top) * dpr;
    });
    canvas.addEventListener('mouseleave', () => { mouse.x = mouse.y = -999; });
    start();
  }

  /* ===== Governance gauges (fill when seen) ===== */
  const gauges = $$('.gauge');
  if (gauges.length) {
    const gio = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); gio.unobserve(e.target); }
    }), { threshold: 0.4 });
    gauges.forEach((g) => gio.observe(g));
  }

  /* ===================================================
     Simulated MUSA conversation (auto-plays, loops)
     =================================================== */
  const SIM = {
    it: [
      { who: 'user', text: 'Buongiorno, vorrei attivare il mio servizio.' },
      { who: 'ai', text: 'Certo! Posso guidarti subito, sono disponibile 24/7 su chat e voce. ✦' },
      { who: 'user', text: 'E se ho bisogno di un operatore umano?' },
      { who: 'ai', text: 'Nessun problema: faccio escalation immediata al team. Il controllo resta sempre alle persone.' },
    ],
    en: [
      { who: 'user', text: 'Hi, I would like to activate my service.' },
      { who: 'ai', text: 'Of course! I can guide you right away — available 24/7 on chat and voice. ✦' },
      { who: 'user', text: 'And if I need a human operator?' },
      { who: 'ai', text: 'No problem: I escalate immediately to the team. Control always stays with people.' },
    ],
  };
  const sim = $('[data-sim-chat]');
  let simLog, simTimers = [];
  const clearSim = () => { simTimers.forEach(clearTimeout); simTimers = []; };
  const addBubble = (m) => {
    const el = document.createElement('div');
    el.className = 'bmsg ' + (m.who === 'ai' ? 'ai' : 'user');
    el.textContent = m.text;
    simLog.appendChild(el);
  };
  const playSim = () => {
    if (!simLog) return;
    clearSim();
    simLog.innerHTML = '';
    const script = SIM[window.__musaLang || 'it'];
    if (reduce) { script.forEach((m) => { addBubble(m); }); simLog.querySelectorAll('.bmsg').forEach((b) => (b.style.opacity = 1, b.style.transform = 'none', b.style.animation = 'none')); return; }
    let t = 500;
    script.forEach((m) => {
      if (m.who === 'ai') {
        simTimers.push(setTimeout(() => {
          const typ = document.createElement('div');
          typ.className = 'btyping';
          typ.innerHTML = '<span></span><span></span><span></span>';
          simLog.appendChild(typ);
        }, t));
        t += 1000;
        simTimers.push(setTimeout(() => {
          const tp = simLog.querySelector('.btyping');
          if (tp) tp.remove();
          addBubble(m);
        }, t));
        t += 1300;
      } else {
        simTimers.push(setTimeout(() => addBubble(m), t));
        t += 1100;
      }
    });
    simTimers.push(setTimeout(playSim, t + 3500)); // loop
  };

  /* ===================================================
     Language switch (IT default, EN via data-en*)
     =================================================== */
  const setLang = (lang) => {
    document.documentElement.lang = lang;
    $$('[data-en]').forEach((el) => {
      if (!el.dataset.it) el.dataset.it = el.textContent;
      el.textContent = lang === 'en' ? el.dataset.en : el.dataset.it;
    });
    $$('[data-en-html]').forEach((el) => {
      if (!el.dataset.itHtml) el.dataset.itHtml = el.innerHTML;
      el.innerHTML = lang === 'en' ? el.dataset.enHtml : el.dataset.itHtml;
    });
    $$('[data-set-lang]').forEach((b) => b.classList.toggle('active', b.dataset.setLang === lang));
    try { localStorage.setItem('musa-lang', lang); } catch (e) {}
    window.__musaLang = lang;
    if (window.__simStarted) playSim(); // restart only if already running
  };
  $$('[data-set-lang]').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.setLang)));

  let saved = 'it';
  try { saved = localStorage.getItem('musa-lang') || 'it'; } catch (e) {}
  window.__musaLang = saved;

  /* start the simulated chat when it scrolls into view */
  if (sim) {
    simLog = $('[data-sim-log]', sim);
    const sio = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { window.__simStarted = true; playSim(); sio.disconnect(); }
    }), { threshold: 0.35 });
    sio.observe(sim);
  }

  setLang(saved);
})();
