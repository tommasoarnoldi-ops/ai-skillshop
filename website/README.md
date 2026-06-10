# Centax — Sito web 2026

Reinterpretazione moderna e dinamica del sito **Centax (CX)**, con una pagina
dedicata a **MUSA**, l'ecosistema AI per il customer care.

## Caratteristiche

- **Palette originale Centax**: nero/antracite + giallo acido (`#F8E900`) + bianco.
- **Tipografia** display grotesque maiuscola (Space Grotesk) + Inter per il testo.
- **Moderno & dinamico**: scroll-reveal, contatori animati, navbar in vetro,
  marquee, bento grid, card con tilt 3D, mockup chat/dashboard, menu mobile.
- **Zero build**: HTML/CSS/JS puro. Header e footer iniettati da un unico
  componente (`assets/js/components.js`) per garantire coerenza tra le pagine.
- **Responsive** e con supporto a `prefers-reduced-motion`.

## Pagine

| File | Pagina |
|------|--------|
| `index.html` | Home |
| `chi-siamo.html` | Chi siamo |
| `cosa-facciamo.html` | Cosa facciamo |
| `perche-cx.html` | Perché Centax |
| `valori.html` | Valori |
| `cx-lab.html` | CX Lab |
| `musa.html` | **MUSA — AI Platform** (nuova) |
| `news.html` | News |
| `lavora-con-noi.html` | Lavora con noi |
| `contatti.html` | Contatti |

## Anteprima locale

Le pagine usano JS per iniettare header/footer, quindi vanno servite via HTTP
(non aperte con `file://`):

```bash
cd website
python3 -m http.server 8080
# poi apri http://localhost:8080
```

## Note

- I contenuti testuali del sito originale erano placeholder (lorem ipsum):
  sono stati riscritti con copy coerente al brand. I contenuti della pagina
  MUSA derivano dalla presentazione ufficiale 2026.
- Il form contatti è dimostrativo (nessun backend collegato).
- Il logo è ricostruito in SVG (`assets/img/logo.svg`).
