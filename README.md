# Dana & Friends Card Studio

Responsive web app that generates playful **Dana & Friends** trading-style cards with **Gemini anime/chibi art** in a TCG-inspired frame.

## Features

- **Photo / live capture** → Gemini stylization into the art frame
- **Parts mixer** → remix friend base / outfit / accessory / backdrop; Gemini paints the portrait (baked anime stills used if API credits are empty)
- **Card front** chrome in code (outlined name, motif border, art frame, attacks, stats, hazard corners, © DANA & FRIENDS 2026)
- **Premium branded card back** (general — not invitation / QR)
- **Download** front PNG + **print sheet** (front + back with crop marks)

Original motifs only — no Nintendo / Pokémon trademarks.

## Gemini models

| Env | Default | Role |
|---|---|---|
| `GOOGLE_GENERATIVE_AI_API_KEY` or `GEMINI_API_KEY` | — | Google Generative Language API key |
| `GEMINI_MODEL` | `gemini-4-argon` | Style direction (text/vision — Argon does **not** emit image pixels) |
| `GEMINI_IMAGE_MODEL` | `gemini-3-pro-image` | Frame art + photo stylization (image output) |

If Google returns **402 / prepayment credits depleted**, top up at [AI Studio projects](https://ai.studio/projects). The studio still loads with baked anime portraits under `public/art/`.

## Quick start

```bash
cp .env.example .env.local   # add your Gemini key
npm install
npm run dev
```

## Deploy (Vercel)

Project: `dana-friends-cards`. Set the same env vars for **Production** and **Preview** (sensitive). Redeploy after changing secrets.
