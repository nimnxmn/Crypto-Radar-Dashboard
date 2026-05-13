# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Heads up: Next.js 15

This project uses Next.js 15 with the App Router and Tailwind v4. **Conventions have changed since older Next/Tailwind training data**:

- Tailwind v4 uses `@import "tailwindcss"` and `@theme inline { ... }` in [src/app/globals.css](src/app/globals.css). There is no `tailwind.config.ts`.
- Route params are `Promise`s. See [src/app/coin/[id]/page.tsx](src/app/coin/[id]/page.tsx) for the pattern: `{ params }: { params: Promise<{ id: string }> }`.
- When in doubt, read `node_modules/next/dist/docs/` instead of relying on memory.

## Commands

```bash
npm run dev      # turbopack dev server on :3000
npm run build    # production build (turbopack)
npm run lint     # eslint
npm run start    # serve the production build
```

## Architecture

This is the Next.js rewrite of the Streamlit prototype preserved in [legacy/CryptoRadar.py](legacy/CryptoRadar.py).

Data flow: **Browser → `/api/*` route handler → Upstash Redis (`lib/cache.ts`) → CoinGecko (`lib/coingecko.ts`)**. Clients never call CoinGecko directly. On cache miss + upstream 429, the handler returns last-known-good with `X-Stale: true`.

The seven radar axes, their min/max bounds, and the `normalize()` function live in [src/lib/metrics.ts](src/lib/metrics.ts) — ported from the original Python. **Keep this file as the single source of truth** for axis definitions; the methodology page and chart both read from it.

## Phase status

- Phase 0 (scaffold + tokens + stubs): done.
- Phase 1 (API routes, radar, picker, mobile): not started.
