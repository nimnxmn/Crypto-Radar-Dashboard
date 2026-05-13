# CryptoRadar

> A coin's market profile, at a glance. Compare up to five cryptocurrencies on seven normalized axes — market cap, liquidity, momentum, ATH recovery, and more.

This is the Next.js rewrite of the original Streamlit prototype, preserved in [legacy/](legacy/) for reference. The rewrite exists to solve four concrete problems with the prototype: rate-limit errors leaking to users, static charts, no mobile support, and a thin feature set.

## Stack

- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui** for primitives
- **Recharts** for the radar (visx planned once it picks up React 19 peer deps)
- **TanStack Query** on the client; Next.js `fetch` cache + **Upstash Redis** on the server
- **Zod** at the API boundary
- **Framer Motion** for micro-interactions
- Deploys to **Vercel**; **Vercel Cron** warms the cache

## Architecture

```
Browser ──► Next.js Route Handler ──► Upstash Redis ──► CoinGecko
                  │                       ▲
                  └───── Vercel Cron ─────┘   (warms cache every 5 min)
```

The CoinGecko key (when set) lives on the server. Clients only ever talk to `/api/*`. On cache miss + upstream 429, the handler returns the last known good value with `X-Stale: true` so the UI can show a "data is a few minutes old" badge instead of breaking.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in Upstash if you want shared caching
npm run dev
```

App runs at http://localhost:3000.

Without `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`, every request falls through to CoinGecko — fine for local development, but expect the free-tier rate limit to bite quickly.

## Project layout

```
src/
├── app/
│   ├── page.tsx              # landing
│   ├── compare/page.tsx      # main tool
│   ├── coin/[id]/page.tsx    # detail page (Phase 2)
│   ├── methodology/page.tsx  # min/max bounds + how they're used
│   └── api/                  # route handlers (Phase 1)
├── components/
│   ├── radar/                # chart + tooltip + legend
│   ├── coin-picker/          # cmdk-based coin search
│   ├── providers.tsx         # QueryClient + Tooltip
│   └── ui/                   # shadcn primitives
└── lib/
    ├── coingecko.ts          # typed API client (server-only)
    ├── cache.ts              # Upstash wrapper with stale fallback
    ├── metrics.ts            # CRITERIA, MIN_MAX, normalize() (ported from Python)
    └── utils.ts              # cn()
```

## Roadmap

- **Phase 0 — Setup.** Scaffold, dependencies, design tokens, route stubs. ← _you are here_
- **Phase 1 — MVP parity.** API routes via Redis. cmdk coin picker. Interactive radar. Mobile responsive.
- **Phase 2 — Depth.** `/coin/[id]` with sparkline. PNG snapshot export. Presets.
- **Phase 3 — Polish.** Motion, SEO, Vercel Cron warmup, analytics, Lighthouse ≥95.
- **Phase 4 (stretch) — Auth + watchlists + email alerts.**

## Notes on free-tier limits

- Upstash free: 10k commands/day. Cron + organic traffic should fit comfortably.
- Vercel Cron at every 5 min = 288 invocations/day.
- CoinGecko free public API: documented limits are ~10–30 req/min. The Redis layer is what keeps us well under this regardless of traffic.
