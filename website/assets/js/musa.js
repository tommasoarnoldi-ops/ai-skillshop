/* MUSA — premium page interactions (loaded only on musa.html) */
(function () {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(pointer:fine)').matches;
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.prototype.slice.call((c || document).querySelectorAll(s));
  const root = document.documentElement;

  /* ===== Inject language switch + theme toggle into navbar ===== */
  let themeBtn = null;
  (function injectControls() {
    const menu = $('.nav__menu');
    if (!menu) return;
    const sw = document.createElement('div');
    sw.className = 'lang-switch';
    sw.innerHTML =
      '<button class="lang-btn active" data-set-lang="it" type="button">IT</button>' +
      '<span>·</span><button class="lang-btn" data-set-lang="en" type="button">EN</button>';
    themeBtn = document.createElement('button');
    themeBtn.className = 'theme-btn';
    themeBtn.type = 'button';
    themeBtn.setAttribute('aria-label', 'Cambia tema');
    themeBtn.innerHTML = '<svg class="ico-svg" aria-hidden="true"><use href="#icon-sun"></use></svg>';
    const cta = menu.querySelector('.nav__cta');
    menu.insertBefore(sw, cta || null);
    menu.insertBefore(themeBtn, cta || null);
  })();

  /* ===== Theme (dark default / light) ===== */
  const setUse = (svgBtn, id) => {
    const u = svgBtn && svgBtn.querySelector('use');
    if (u) { u.setAttribute('href', id); u.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', id); }
  };
  const applyTheme = (t) => {
    const light = t === 'light';
    if (light) root.setAttribute('data-theme', 'light');
    else root.removeAttribute('data-theme');
    try { localStorage.setItem('musa-theme', light ? 'light' : 'dark'); } catch (e) {}
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', light ? '#F3F2EC' : '#0B0B0B');
    if (themeBtn) {
      setUse(themeBtn, light ? '#icon-moon' : '#icon-sun');
      themeBtn.setAttribute('aria-label', light ? 'Passa al tema scuro' : 'Passa al tema chiaro');
    }
    window.__musaTheme = light ? 'light' : 'dark';
  };
  if (themeBtn) themeBtn.addEventListener('click', () => applyTheme(window.__musaTheme === 'light' ? 'dark' : 'light'));
  let savedTheme = 'dark';
  try { savedTheme = localStorage.getItem('musa-theme') || 'dark'; } catch (e) {}
  applyTheme(savedTheme);

  /* ===== Scroll-spy side navigation ===== */
  const spyItems = [
    { id: 'top', it: 'Intro', en: 'Intro' }, { id: 'filosofia', it: 'Filosofia', en: 'Philosophy' },
    { id: 'contesto', it: 'Contesto', en: 'Context' }, { id: 'demo', it: 'Prodotto', en: 'Product' },
    { id: 'applicazione', it: 'Applicazione', en: 'Application' }, { id: 'flow', it: 'Flow', en: 'Flow' },
    { id: 'dashboard', it: 'Dashboard', en: 'Dashboard' }, { id: 'governance', it: 'Governance', en: 'Governance' },
    { id: 'faq', it: 'FAQ', en: 'FAQ' },
  ];
  (function buildSpy() {
    const wrap = document.createElement('nav');
    wrap.className = 'spy';
    wrap.setAttribute('aria-label', 'Sezioni della pagina');
    spyItems.forEach((it) => {
      const a = document.createElement('a');
      a.href = '#' + it.id; a.dataset.spy = it.id; a.setAttribute('data-label', it.it);
      a.setAttribute('aria-label', it.it);
      wrap.appendChild(a);
    });
    document.body.appendChild(wrap);
    const anchors = Array.prototype.slice.call(wrap.children);
    window.__spyLabels = (lang) => spyItems.forEach((it, i) => {
      anchors[i].setAttribute('data-label', it[lang] || it.it);
      anchors[i].setAttribute('aria-label', it[lang] || it.it);
    });
    const secs = spyItems.map((it) => document.getElementById(it.id)).filter(Boolean);
    const obs = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) anchors.forEach((a) => a.classList.toggle('active', a.dataset.spy === e.target.id));
    }), { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    secs.forEach((s) => obs.observe(s));
  })();

  /* ===== FAQ accordion (single-open, a11y) ===== */
  (function faq() {
    const items = $$('[data-faq] .faq__item');
    items.forEach((item) => {
      const q = $('.faq__q', item);
      if (!q) return;
      q.addEventListener('click', () => {
        const open = item.classList.contains('open');
        items.forEach((i) => { i.classList.remove('open'); const b = $('.faq__q', i); if (b) b.setAttribute('aria-expanded', 'false'); });
        if (!open) { item.classList.add('open'); q.setAttribute('aria-expanded', 'true'); }
      });
      q.addEventListener('keydown', (e) => { if (e.key === 'Escape') { item.classList.remove('open'); q.setAttribute('aria-expanded', 'false'); } });
    });
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

  /* ===== Tabs (a11y: roving tabindex + arrows) ===== */
  $$('[data-tabs]').forEach((group) => {
    const btns = $$('.tabs__btn', group);
    const panels = $$('.tabs__panel', group);
    const activate = (b) => {
      btns.forEach((x) => { x.classList.remove('active'); x.setAttribute('aria-selected', 'false'); x.tabIndex = -1; });
      panels.forEach((x) => x.classList.remove('active'));
      b.classList.add('active'); b.setAttribute('aria-selected', 'true'); b.tabIndex = 0;
      const t = group.querySelector('#' + b.getAttribute('aria-controls'));
      if (t) t.classList.add('active');
    };
    btns.forEach((b, i) => {
      b.addEventListener('click', () => activate(b));
      b.addEventListener('keydown', (e) => {
        let ni = -1;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') ni = (i + 1) % btns.length;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ni = (i - 1 + btns.length) % btns.length;
        else if (e.key === 'Home') ni = 0; else if (e.key === 'End') ni = btns.length - 1;
        if (ni >= 0) { e.preventDefault(); activate(btns[ni]); btns[ni].focus(); }
      });
    });
  });

  /* ===== Hero particle network (paused when offscreen, theme-aware) ===== */
  const canvas = $('[data-particles]');
  if (canvas && !reduce) {
    const ctx = canvas.getContext('2d');
    let w, h, pts, mouse = { x: -999, y: -999 }, raf = 0, visible = true;
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
      const light = root.getAttribute('data-theme') === 'light';
      const node = light ? '150,135,0' : '248,233,0';
      const link = light ? '120,108,0' : '248,233,0';
      const mlink = light ? '20,20,10' : '255,255,255';
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.6 * dpr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${node},.55)`; ctx.fill();
        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j], dx = p.x - q.x, dy = p.y - q.y, d = Math.hypot(dx, dy);
          if (d < 130 * dpr) {
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(${link},${0.14 * (1 - d / (130 * dpr))})`; ctx.lineWidth = dpr; ctx.stroke();
          }
        }
        const md = Math.hypot(p.x - mouse.x, p.y - mouse.y);
        if (md < 150 * dpr) {
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(${mlink},${0.18 * (1 - md / (150 * dpr))})`; ctx.lineWidth = dpr; ctx.stroke();
        }
      }
      raf = requestAnimationFrame(draw);
    };
    const start = () => { cancelAnimationFrame(raf); init(); draw(); };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };
    window.addEventListener('resize', () => { if (visible) start(); });
    if (fine) canvas.addEventListener('mousemove', (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - r.left) * dpr; mouse.y = (e.clientY - r.top) * dpr;
    });
    canvas.addEventListener('mouseleave', () => { mouse.x = mouse.y = -999; });
    const pio = new IntersectionObserver((es) => {
      visible = es[0].isIntersecting;
      if (visible) start(); else stop();
    }, { threshold: 0 });
    pio.observe(canvas);
  }

  /* ===== Governance gauges (fill when seen) ===== */
  const gio = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); gio.unobserve(e.target); }
  }), { threshold: 0.4 });
  $$('.gauge').forEach((g) => gio.observe(g));

  /* ===== Console: numbers that grow in a loop (+ arcs) ===== */
  (function consoleNumbers() {
    const cns = $('.console');
    if (!cns) return;
    const nums = $$('[data-grow]', cns);
    if (!nums.length) return;
    const fmt = {
      int: (v) => Math.round(v).toLocaleString('it-IT'),
      pct: (v) => Math.round(v) + '%',
      pct1: (v) => v.toFixed(1).replace('.', ',') + '%',
      time: (v) => { const s = Math.round(v); return Math.floor(s / 60) + 'm ' + String(s % 60).padStart(2, '0') + 's'; },
    };
    const setVal = (el, v) => {
      el.textContent = (fmt[el.dataset.fmt] || fmt.int)(v);
      if (el.classList.contains('rgauge__v')) {
        const arc = el.closest('.rgauge').querySelector('.rg-arc');
        if (arc) arc.style.strokeDashoffset = (226 * (1 - Math.max(0, Math.min(100, v)) / 100)).toFixed(1);
      }
    };
    const loop = (el) => {
      const to = parseFloat(el.dataset.grow), from = parseFloat(el.dataset.from || '0');
      const dur = 2200, hold = 1500;
      const run = () => {
        const start = performance.now();
        const step = (now) => {
          const p = Math.min((now - start) / dur, 1);
          setVal(el, from + (to - from) * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(step);
          else setTimeout(run, hold);
        };
        requestAnimationFrame(step);
      };
      run();
    };
    if (reduce) { nums.forEach((el) => setVal(el, parseFloat(el.dataset.grow))); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { nums.forEach(loop); io.disconnect(); }
    }), { threshold: 0.3 });
    io.observe(cns);
  })();

  /* ===================================================
     KINETIC TYPOGRAPHY — line-mask reveal on headings
     =================================================== */
  const KIN = reduce ? [] : $$('.sec-head h2.display, .split h2.display, .cta h2.display');
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const buildKinetic = (el) => {
    if (reduce) return;
    if (!el.hasAttribute('data-en') && !el.hasAttribute('data-en-html')) {
      if (el.__src == null) el.__src = el.innerHTML; else el.innerHTML = el.__src;
    }
    const groups = []; let cur = [];
    Array.prototype.forEach.call(el.childNodes, (n) => {
      if (n.nodeType === 1 && n.tagName === 'BR') { groups.push(cur); cur = []; }
      else cur.push(n.nodeType === 1 ? n.outerHTML : esc(n.textContent));
    });
    groups.push(cur);
    el.classList.add('kin');
    el.innerHTML = groups.map((g, i) =>
      `<span class="kin-line"><span class="kin-inner" style="transition-delay:${(i * 0.09).toFixed(2)}s">${g.join('') || '&nbsp;'}</span></span>`
    ).join('');
  };
  const applyKinetic = () => KIN.forEach(buildKinetic);
  if (KIN.length) {
    const kio = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); kio.unobserve(e.target); }
    }), { threshold: 0.2 });
    KIN.forEach((el) => kio.observe(el));
  }

  /* ===================================================
     Simulated MUSA conversation (auto-plays, loops)
     =================================================== */
  const SIM = {
    it: [
      { who: 'ai', text: 'Buongiorno sono MUSA, come posso aiutarti?' },
      { who: 'user', text: 'Buongiorno, avrei bisogno di assistenza' },
      { who: 'ai', text: 'Certo, dimmi pure. Sono disponibile a fornirti assistenza 24/7' },
      { who: 'user', text: 'E se ho bisogno di un operatore?' },
      { who: 'ai', text: 'Se non dovessi essere in grado di risponderti ti metterò in contatto con il primo operatore disponibile' },
    ],
    en: [
      { who: 'ai', text: "Good morning, I'm MUSA. How can I help you?" },
      { who: 'user', text: 'Good morning, I need some assistance' },
      { who: 'ai', text: "Of course, go ahead. I'm available to assist you 24/7" },
      { who: 'user', text: 'And if I need an operator?' },
      { who: 'ai', text: "If I'm not able to answer you, I'll connect you with the first available operator" },
    ],
  };
  let audioCtx = null, soundOn = false;
  const blip = (who) => {
    if (!soundOn) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator(), g = audioCtx.createGain(), t = audioCtx.currentTime;
      o.type = 'sine'; o.frequency.value = who === 'ai' ? 523 : 392;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.06, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      o.connect(g); g.connect(audioCtx.destination); o.start(t); o.stop(t + 0.2);
    } catch (e) {}
  };
  const soundBtn = $('[data-sound]');
  if (soundBtn) soundBtn.addEventListener('click', () => {
    soundOn = !soundOn;
    soundBtn.classList.toggle('on', soundOn);
    soundBtn.setAttribute('aria-pressed', soundOn ? 'true' : 'false');
    setUse(soundBtn, soundOn ? '#icon-sound-on' : '#icon-sound-off');
    if (soundOn) blip('ai');
  });
  const sim = $('[data-sim-chat]');
  let simLog, simTimers = [];
  const clearSim = () => { simTimers.forEach(clearTimeout); simTimers = []; };
  const addBubble = (m) => {
    const el = document.createElement('div');
    el.className = 'bmsg ' + (m.who === 'ai' ? 'ai' : 'user');
    el.textContent = m.text; simLog.appendChild(el); blip(m.who);
  };
  const playSim = () => {
    if (!simLog) return;
    clearSim(); simLog.innerHTML = '';
    const script = SIM[window.__musaLang || 'it'];
    if (reduce) { script.forEach(addBubble); simLog.querySelectorAll('.bmsg').forEach((b) => { b.style.opacity = 1; b.style.transform = 'none'; b.style.animation = 'none'; }); return; }
    let t = 500;
    script.forEach((m) => {
      if (m.who === 'ai') {
        simTimers.push(setTimeout(() => {
          const typ = document.createElement('div'); typ.className = 'btyping';
          typ.innerHTML = '<span></span><span></span><span></span>'; simLog.appendChild(typ);
        }, t));
        t += 1000;
        simTimers.push(setTimeout(() => { const tp = simLog.querySelector('.btyping'); if (tp) tp.remove(); addBubble(m); }, t));
        t += 1300;
      } else { simTimers.push(setTimeout(() => addBubble(m), t)); t += 1100; }
    });
    simTimers.push(setTimeout(playSim, t + 3500));
  };

  /* ===================================================
     Language switch (IT default, EN via data-en*)
     =================================================== */
  const setLang = (lang) => {
    root.lang = lang;
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
    if (window.__spyLabels) window.__spyLabels(lang);
    applyKinetic(); // re-wrap headings after translation
    if (window.__simStarted) playSim();
  };
  $$('[data-set-lang]').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.setLang)));
  let saved = 'it';
  try { saved = localStorage.getItem('musa-lang') || 'it'; } catch (e) {}
  window.__musaLang = saved;

  if (sim) {
    simLog = $('[data-sim-log]', sim);
    const sio = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { window.__simStarted = true; playSim(); sio.disconnect(); }
    }), { threshold: 0.35 });
    sio.observe(sim);
  }

  /* ===== Chicca: scramble/decode on section labels ===== */
  if (!reduce) {
    const CH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·/+';
    const scramble = (el) => {
      const final = el.textContent;
      el.classList.add('scrambling');
      let f = 0;
      const id = setInterval(() => {
        f++;
        let out = '';
        for (let i = 0; i < final.length; i++) {
          if (i < f / 2 || final[i] === ' ' || final[i] === '·') out += final[i];
          else out += CH[Math.floor(Math.random() * CH.length)];
        }
        el.textContent = out;
        if (f / 2 >= final.length) { clearInterval(id); el.textContent = final; el.classList.remove('scrambling'); }
      }, 32);
    };
    const eio = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { scramble(e.target); eio.unobserve(e.target); }
    }), { threshold: 0.6 });
    $$('.eyebrow').forEach((el) => eio.observe(el));
  }

  /* ===== Chicca: easter egg — type "musa" ===== */
  const confetti = () => {
    const colors = ['#F8E900', '#FFFFFF', '#D9CC00'];
    for (let i = 0; i < 46; i++) {
      const c = document.createElement('div');
      c.className = 'confetti';
      c.style.left = Math.random() * 100 + 'vw';
      c.style.background = colors[i % colors.length];
      document.body.appendChild(c);
      const dx = (Math.random() - 0.5) * 260;
      c.animate(
        [{ transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
         { transform: `translate(${dx}px,${window.innerHeight + 80}px) rotate(${Math.random() * 720}deg)`, opacity: 0.9 }],
        { duration: 1800 + Math.random() * 1200, easing: 'cubic-bezier(.2,.6,.3,1)' }
      ).onfinish = () => c.remove();
    }
  };
  let buf = '';
  window.addEventListener('keydown', (e) => {
    if (!e.key || e.key.length !== 1) return;
    buf = (buf + e.key.toLowerCase()).slice(-4);
    if (buf === 'musa') {
      buf = '';
      if (!reduce) confetti();
      const t = $('.m-title');
      if (t) { t.classList.add('pulse'); setTimeout(() => t.classList.remove('pulse'), 650); }
    }
  });

  /* ===================================================
     UNIFIED scroll loop (rAF-batched): progress bar,
     back-to-top ring, pinned cinematic statement
     =================================================== */
  const bar = $('.scrollbar');
  const toTop = $('[data-to-top]');
  const topProg = $('[data-top-prog]');
  const RING = 154;
  const stage = $('[data-pin-stage]');
  const words = $$('[data-pin-word]');
  let ticking = false;
  const frame = () => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight || 1;
    const y = h.scrollTop;
    const p = y / max;
    if (bar) bar.style.width = (p * 100).toFixed(2) + '%';
    if (topProg) topProg.style.strokeDashoffset = (RING * (1 - p)).toFixed(1);
    if (toTop) toTop.classList.toggle('show', y > 600);
    if (stage && words.length && window.innerWidth > 980) {
      const r = stage.getBoundingClientRect();
      const total = stage.offsetHeight - window.innerHeight;
      const prog = Math.min(1, Math.max(0, -r.top / (total || 1)));
      const idx = Math.min(words.length - 1, Math.floor(prog * words.length));
      words.forEach((wd, i) => wd.classList.toggle('on', i === idx));
    }
    ticking = false;
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
  if (words[0] && window.innerWidth > 980) words[0].classList.add('on');
  frame();
  if (toTop) toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ===== boot ===== */
  setLang(saved);
})();
