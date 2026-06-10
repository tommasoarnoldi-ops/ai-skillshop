/* MUSA — page-specific dynamism (loaded only on musa.html) */
(function () {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Scroll progress bar ---- */
  const bar = document.querySelector('.scrollbar');
  if (bar) {
    const upd = () => {
      const h = document.documentElement;
      const p = h.scrollTop / (h.scrollHeight - h.clientHeight || 1);
      bar.style.width = (p * 100).toFixed(2) + '%';
    };
    window.addEventListener('scroll', upd, { passive: true });
    upd();
  }

  /* ---- Spotlight cards: track cursor for radial highlight ---- */
  if (!reduce && window.matchMedia('(pointer:fine)').matches) {
    document.querySelectorAll('.spot').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', ((e.clientX - r.left) / r.width) * 100 + '%');
        el.style.setProperty('--my', ((e.clientY - r.top) / r.height) * 100 + '%');
      });
    });
  }

  /* ---- Magnetic buttons ---- */
  if (!reduce && window.matchMedia('(pointer:fine)').matches) {
    document.querySelectorAll('[data-magnetic]').forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
      });
      btn.addEventListener('mouseleave', () => (btn.style.transform = ''));
    });
  }

  /* ---- Interactive tabs ---- */
  document.querySelectorAll('[data-tabs]').forEach((group) => {
    const btns = group.querySelectorAll('.tabs__btn');
    const panels = group.querySelectorAll('.tabs__panel');
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

  /* ---- Typed live conversation (plays when scrolled into view) ---- */
  const chat = document.querySelector('[data-live-chat]');
  if (chat) {
    const script = [
      { who: 'user', text: 'Ciao, ho bisogno di assistenza per attivare il mio servizio.' },
      { who: 'ai', text: 'Certo! Ti guido passo passo. Posso farlo subito, sono disponibile 24/7. ✦' },
      { who: 'user', text: 'Perfetto, e se mi serve un operatore umano?' },
      { who: 'ai', text: 'Nessun problema: quando serve, faccio escalation immediata al team. Il controllo resta sempre alle persone.' },
    ];
    const play = () => {
      let i = 0;
      const head = chat.querySelector('.live-chat__head');
      const addTyping = () => {
        const t = document.createElement('div');
        t.className = 'lc-typing';
        t.innerHTML = '<span></span><span></span><span></span>';
        chat.appendChild(t);
        return t;
      };
      const next = () => {
        if (i >= script.length) {
          setTimeout(() => {
            chat.querySelectorAll('.lc-msg,.lc-typing').forEach((n) => n.remove());
            i = 0;
            next();
          }, 4200);
          return;
        }
        const m = script[i];
        const delay = m.who === 'ai' ? 900 : 500;
        const typing = m.who === 'ai' ? addTyping() : null;
        setTimeout(() => {
          if (typing) typing.remove();
          const el = document.createElement('div');
          el.className = 'lc-msg ' + (m.who === 'ai' ? 'lc-ai' : 'lc-user');
          el.textContent = m.text;
          chat.appendChild(el);
          chat.scrollTop = chat.scrollHeight;
          i++;
          setTimeout(next, m.who === 'ai' ? 1100 : 800);
        }, delay);
      };
      next();
    };
    if (reduce) {
      script.forEach((m) => {
        const el = document.createElement('div');
        el.className = 'lc-msg ' + (m.who === 'ai' ? 'lc-ai' : 'lc-user');
        el.style.animation = 'none';
        el.style.opacity = 1;
        el.style.transform = 'none';
        el.textContent = m.text;
        chat.appendChild(el);
      });
    } else {
      const io = new IntersectionObserver(
        (es) => es.forEach((e) => { if (e.isIntersecting) { play(); io.disconnect(); } }),
        { threshold: 0.4 }
      );
      io.observe(chat);
    }
  }
})();
