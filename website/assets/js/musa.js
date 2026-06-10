/* MUSA — premium page interactions (loaded only on musa.html) */
(function () {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(pointer:fine)').matches;
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.prototype.slice.call((c || document).querySelectorAll(s));

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
    window.addEventListener('load', () => { p = Math.max(p, 88); });
  }

  /* ===== Custom cursor ===== */
  if (fine && !reduce) {
    const dot = $('[data-cursor-dot]');
    const ring = $('[data-cursor-ring]');
    if (dot && ring) {
      document.body.classList.add('cursor-on');
      let rx = 0, ry = 0, dx = 0, dy = 0;
      window.addEventListener('mousemove', (e) => {
        dx = e.clientX; dy = e.clientY;
        dot.style.opacity = ring.style.opacity = 1;
        dot.style.transform = `translate(${dx}px,${dy}px) translate(-50%,-50%)`;
      });
      const loop = () => {
        rx += (dx - rx) * 0.18; ry += (dy - ry) * 0.18;
        ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
        requestAnimationFrame(loop);
      };
      loop();
      document.addEventListener('mousedown', () => ring.classList.add('down'));
      document.addEventListener('mouseup', () => ring.classList.remove('down'));
      const hov = 'a,button,input,.bot__chip,.tabs__btn,.card,.pill,.org__role';
      document.addEventListener('mouseover', (e) => { if (e.target.closest(hov)) ring.classList.add('hover'); });
      document.addEventListener('mouseout', (e) => { if (e.target.closest(hov)) ring.classList.remove('hover'); });
    }
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
        btn.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.25}px,${(e.clientY - r.top - r.height / 2) * 0.35}px)`;
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
    $$('[data-en-ph]').forEach((el) => {
      if (!el.dataset.itPh) el.dataset.itPh = el.placeholder;
      el.placeholder = lang === 'en' ? el.dataset.enPh : el.dataset.itPh;
    });
    $$('[data-set-lang]').forEach((b) => b.classList.toggle('active', b.dataset.setLang === lang));
    try { localStorage.setItem('musa-lang', lang); } catch (e) {}
    window.__musaLang = lang;
    if (window.__seedBot) window.__seedBot();
  };
  $$('[data-set-lang]').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.setLang)));
  let saved = 'it';
  try { saved = localStorage.getItem('musa-lang') || 'it'; } catch (e) {}

  /* ===================================================
     Interactive MUSA chatbot (scripted, no backend)
     =================================================== */
  const bot = $('[data-bot]');
  if (bot) {
    const log = $('[data-bot-log]', bot);
    const chipsBox = $('[data-bot-chips]', bot);
    const form = $('[data-bot-form]', bot);
    const input = $('[data-bot-text]', bot);

    const T = {
      it: {
        greet: "Ciao! Sono MUSA, l'AI di Centax per il customer care. Chiedimi pure: canali, knowledge base, escalation o una demo. ✦",
        chips: ['Cos’è MUSA?', 'Su quali canali?', 'E se serve un operatore?', 'Voglio una demo'],
        intents: [
          { k: ['cos', 'chi sei', 'cosa', 'come funzion', 'fai'], a: "Sono l'ecosistema AI di Centax: assisto i clienti finali 24/7 e affianco gli operatori in tempo reale, recuperando informazioni dalla knowledge base. ✦" },
          { k: ['canal', 'voce', 'chat', 'voicebot', 'chatbot', 'telefon'], a: 'Lavoro su chat e voce, 24/7, su tutti i canali digitali: un’unica intelligenza, più canali di interazione.' },
          { k: ['operator', 'umano', 'persona', 'escalation'], a: 'Quando serve, faccio escalation immediata a un operatore umano. Il controllo resta sempre nelle mani del team.' },
          { k: ['knowledge', 'kb', 'conoscenz', 'sapere', 'impar'], a: 'Attingo a una knowledge base validata e versionata. Se non so rispondere non improvviso: apro un ticket e imparo per la volta successiva.' },
          { k: ['demo', 'prov', 'contatt', 'prezz', 'cost', 'offert'], a: 'Volentieri! Per una demo personalizzata sui tuoi casi d’uso ti mettiamo in contatto con il team: usa il pulsante "Richiedi una demo". ✦' },
          { k: ['ciao', 'salve', 'buongiorno', 'ehi', 'hey'], a: 'Ciao! Come posso aiutarti oggi?' },
        ],
        fallback: 'Ottima domanda! Posso aiutarti su canali, knowledge base, escalation e demo. Per dettagli specifici ti metto in contatto con il team Centax. ✦',
      },
      en: {
        greet: "Hi! I'm MUSA, Centax's AI for customer care. Ask me about channels, knowledge base, escalation or a demo. ✦",
        chips: ['What is MUSA?', 'Which channels?', 'What if I need an operator?', 'I want a demo'],
        intents: [
          { k: ['what is', 'who are', 'what', 'how do', 'work'], a: "I'm Centax's AI ecosystem: I assist end customers 24/7 and support operators in real time, retrieving information from the knowledge base. ✦" },
          { k: ['channel', 'voice', 'chat', 'voicebot', 'chatbot', 'phone'], a: 'I work on chat and voice, 24/7, across every digital channel: one intelligence, multiple interaction channels.' },
          { k: ['operator', 'human', 'person', 'escalation'], a: 'When needed, I escalate immediately to a human operator. Control always stays in the team’s hands.' },
          { k: ['knowledge', 'kb', 'learn'], a: 'I draw on a validated, versioned knowledge base. If I don’t know, I never improvise: I open a ticket and learn for next time.' },
          { k: ['demo', 'try', 'contact', 'price', 'cost', 'quote'], a: 'Gladly! For a tailored demo on your use cases we’ll connect you with the team: use the "Request a demo" button. ✦' },
          { k: ['hi', 'hello', 'hey', 'good morning'], a: 'Hi! How can I help you today?' },
        ],
        fallback: 'Great question! I can help with channels, knowledge base, escalation and demos. For specifics I’ll connect you with the Centax team. ✦',
      },
    };

    const lang = () => window.__musaLang || 'it';
    const add = (who, text) => {
      const el = document.createElement('div');
      el.className = 'bmsg ' + who;
      el.textContent = text;
      log.appendChild(el);
      log.scrollTop = log.scrollHeight;
      return el;
    };
    const reply = (text) => {
      const t = T[lang()];
      const low = text.toLowerCase();
      let ans = t.fallback;
      for (const it of t.intents) { if (it.k.some((k) => low.includes(k))) { ans = it.a; break; } }
      const typing = document.createElement('div');
      typing.className = 'btyping';
      typing.innerHTML = '<span></span><span></span><span></span>';
      log.appendChild(typing); log.scrollTop = log.scrollHeight;
      setTimeout(() => { typing.remove(); add('ai', ans); }, 750 + Math.random() * 500);
    };
    const send = (text) => { if (!text.trim()) return; add('user', text); reply(text); };

    window.__seedBot = () => {
      const t = T[lang()];
      log.innerHTML = '';
      chipsBox.innerHTML = '';
      add('ai', t.greet);
      t.chips.forEach((c) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'bot__chip'; b.textContent = c;
        b.addEventListener('click', () => { send(c); });
        chipsBox.appendChild(b);
      });
    };

    form.addEventListener('submit', (e) => { e.preventDefault(); send(input.value); input.value = ''; });
  }

  /* apply saved language now that bot seed exists */
  setLang(saved);
})();
