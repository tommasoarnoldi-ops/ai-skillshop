# Deploy del sito Centax

Il sito è statico (HTML/CSS/JS, nessun build). Cartella da pubblicare: **`website/`**.

---

## 🟢 Netlify

### Opzione 1 — Drag & drop (la più veloce, niente Git)
1. Vai su <https://app.netlify.com/drop>
2. Trascina la cartella **`website`** nella pagina.
3. Pronto: Netlify ti dà subito un URL pubblico (es. `random-name.netlify.app`).

### Opzione 2 — Collegato al repo (deploy automatico a ogni push)
1. Netlify → **Add new site → Import an existing project** → scegli il repo
   `tommasoarnoldi-ops/ai-skillshop`.
2. Branch: `claude/clever-wright-mkmyfi` (o `main` dopo il merge).
3. Le impostazioni vengono lette da `netlify.toml`:
   - Publish directory: `website`
   - Build command: *(vuoto)*
4. **Deploy site**.

---

## ▲ Vercel

1. Vercel → **Add New → Project** → importa `tommasoarnoldi-ops/ai-skillshop`.
2. Nella schermata di configurazione:
   - **Framework Preset:** `Other`
   - **Root Directory:** clicca *Edit* e seleziona **`website`** ← passaggio chiave
   - Build Command / Output: lasciali vuoti.
3. **Deploy**. Avrai un URL `*.vercel.app`.

> Il file `vercel.json` abilita gli URL puliti (`/musa` invece di `/musa.html`).

---

## Note
- Per un dominio personalizzato (es. `cxcentax.com`) basta aggiungerlo
  nelle impostazioni di Netlify/Vercel e puntare il DNS come indicato.
- Ogni `git push` sul branch collegato rigenera automaticamente il deploy.
