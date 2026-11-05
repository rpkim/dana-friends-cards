# Dana & Friends Card Studio

Responsive web app that generates playful **Dana & Friends** trading-style cards.

## Features

- **Photo / live capture** → anime/chibi stylization into the art frame  
  (Vercel AI Gateway when `AI_GATEWAY_API_KEY` is set; local canvas fallback otherwise)
- **Parts mixer** — original starter layers (skin, hair, eyes, outfit, accessory, backdrop) in four themes: Dana yellow, Thea autumn, Ritsuki blue, Josephine pink
- **Card front** matching TCG-inspired anatomy (name, HP, art, attacks, stats, flavor, © DANA & FRIENDS 2026)
- **General branded card back** (not invitation / QR)
- **Download** front PNG + **print sheet** (front + back with crop marks)

Original motifs and borders only — no Nintendo / Pokémon trademarks.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

Copy `.env.example` → `.env.local`:

| Variable | Required | Purpose |
|---|---|---|
| `AI_GATEWAY_API_KEY` | No | Photo stylization via [Vercel AI Gateway](https://vercel.com/docs/ai-gateway) |
| `AI_GATEWAY_IMAGE_MODEL` | No | Override image model (default `google/gemini-2.5-flash-image`) |

On Vercel, OIDC can also authenticate the Gateway without a key when the project is linked.

## Deploy

Connect this repo to a new Vercel project (framework: Next.js). Add `AI_GATEWAY_API_KEY` in Project → Settings → Environment Variables if you want AI stylization.

## License

Card set branding © DANA & FRIENDS 2026. Starter assets in this repo are original for the fan play set.
