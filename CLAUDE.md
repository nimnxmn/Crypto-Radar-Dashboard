# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Heads up: Next.js 16 + Tailwind v4 + base-ui shadcn

Some conventions have changed since older training data — verify before relying on memory:

- **Tailwind v4**: tokens live in [src/app/globals.css](src/app/globals.css) under `@import "tailwindcss"` and `@theme inline { ... }`. There is no `tailwind.config.ts`.
- **Route params are `Promise`s** in Next.js 16. See [src/app/coin/[id]/page.tsx](src/app/coin/[id]/page.tsx): `{ params }: { params: Promise<{ id: string }> }`.
- **shadcn here is built on `@base-ui/react`, NOT Radix.** Implications:
  - `Button` does **not** have `asChild`. To make a link look like a button, put `buttonVariants({ size, variant })` on the `<Link>` itself — see [src/app/page.tsx](src/app/page.tsx).
  - `TooltipProvider` takes `delay`, **not** `delayDuration`.
  - When in doubt about a primitive's props, read its source under `src/components/ui/`.
- **visx is not installed** — its peer deps don't accept React 19 yet. Charts use **Recharts**. Revisit visx in Phase 1 only if Recharts can't deliver the interactivity we want.
- When in doubt about Next.js itself, read `node_modules/next/dist/docs/` — see [AGENTS.md](AGENTS.md).

## Commands

```bash
npm run dev      # turbopack dev server on :3000
npm run build    # production build (turbopack)
npm run lint     # eslint
npm run start    # serve the production build
```

## Architecture

The Next.js rewrite of the Streamlit prototype, preserved in [legacy/CryptoRadar.py](legacy/CryptoRadar.py).

Data flow: **Browser → `/api/*` route handler → Upstash Redis ([src/lib/cache.ts](src/lib/cache.ts)) → CoinGecko ([src/lib/coingecko.ts](src/lib/coingecko.ts))**. Clients never call CoinGecko directly. On cache miss + upstream 429, the handler returns last-known-good with `X-Stale: true`.

The seven radar axes, their min/max bounds, and the `normalize()` function live in [src/lib/metrics.ts](src/lib/metrics.ts) — ported from the original Python. **Keep this file as the single source of truth** for axis definitions; the methodology page and the future chart both read from it.

## GitHub workflow

- Remote: `nimnxmn/Crypto-Radar-Dashboard` (default branch `main`).
- Pushes go through a **feature branch + PR** even for solo work — this is a portfolio repo, the PR diffs are the reviewable surface.
- Never `--force` push to `main`.
- `gh` CLI is installed and authenticated; use it for PR creation.

## Phase walkthroughs

After **every phase** ships, write a teaching-oriented deep dive to
`docs/walkthroughs/phase-N.md` — the repo owner is using this project to learn.
For each file changed, explain *what it is*, *why it's written that way*, and
*the gotcha a newer dev would miss* — don't just describe the code. This is a
required deliverable of each phase, not optional.

- **Phase 0** — [docs/walkthroughs/phase-0.md](docs/walkthroughs/phase-0.md).

## Phase status

- **Phase 0** — scaffold + tokens + stubs: done, PR [#1](https://github.com/nimnxmn/Crypto-Radar-Dashboard/pull/1) (branch `nextjs-rewrite`).
- **Phase 1** — API routes (`src/app/api/coins/`, `src/app/api/coin/[id]/`), Recharts radar component in `src/components/radar/`, cmdk coin picker in `src/components/coin-picker/`, mobile sheet on `/compare`: **not started**.
- **Phase 2** — `/coin/[id]` detail page with sparkline, PNG snapshot export, preset chips, skeleton states.
- **Phase 3** — Framer Motion micro-interactions, SEO + per-route OG images, Vercel Cron warmup, analytics, Lighthouse ≥95.
- **Phase 4** (stretch) — auth (Clerk), Neon-backed watchlists, Resend email alerts.
