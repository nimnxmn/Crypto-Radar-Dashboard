# Phase 0 deep dive — the scaffold

> A learning walkthrough of everything that landed in Phase 0 of the CryptoRadar
> Next.js rewrite (PR #1). For each file: *what it is*, *why it's written that
> way*, and *the gotcha a newer dev would miss*.

---

## 1. What Phase 0 is (and isn't)

Phase 0 is a **scaffold**. The point of a scaffold is to get the skeleton,
tooling, and conventions right *before* writing features — so every later phase
slots into a known shape instead of inventing structure as it goes.

What Phase 0 **did** ship:

- A Next.js 16 + Tailwind v4 project that builds and runs.
- A design-token system (colors, radii, fonts) wired through CSS variables.
- A fully typed **data layer** (`src/lib/`) — the functions that will fetch and
  cache CoinGecko data — written and type-checked, but *not yet called by any
  route*.
- Four **stub pages** so the routes exist and the navigation works.
- A set of `shadcn`/base-ui UI primitives ready to compose.

What Phase 0 **did not** do (deliberately deferred):

- No `/api/*` route handlers — nothing actually fetches live data yet.
- No radar chart.
- No coin picker.

Think of it like building a house: Phase 0 is the foundation, framing, and
electrical rough-in. The rooms (features) come later, but they all plug into
wiring that already exists.

---

## 2. The stack, dependency by dependency

From [package.json](../../package.json). Knowing *why* each library is here
matters more than knowing it's here.

### Runtime dependencies

| Package | Why it's in the project |
|---|---|
| `next` `16.2.6` | The framework. App Router, route handlers, server components. |
| `react` / `react-dom` `19.2.4` | React 19 — required by Next 16. |
| `@base-ui/react` | The headless UI primitive library. **This is the big one** — see note below. |
| `shadcn` | A *code generator* for components, not a runtime UI library. It copies component source into `src/components/ui/` so you own and can edit it. |
| `class-variance-authority` (cva) | Builds "variant" APIs for components — e.g. `Button` having `size` and `variant` props that map to class strings. |
| `clsx` + `tailwind-merge` | `clsx` joins conditional class names; `tailwind-merge` dedupes conflicting Tailwind classes (`p-2 p-4` → `p-4`). Combined in the `cn()` helper. |
| `cmdk` | The command-menu primitive — powers the future "press a key, search a coin" picker. |
| `recharts` | The charting library. The radar chart will be built on this. |
| `@tanstack/react-query` | Client-side server-state cache: dedupes requests, caches responses, handles loading/error states. |
| `@upstash/redis` | HTTP-based Redis client. Used **server-side** to cache CoinGecko responses. |
| `zod` `4.x` | Runtime schema validation. Validates the *shape* of data crossing the network boundary. |
| `framer-motion` | Animation library — reserved for Phase 3 micro-interactions. |
| `vaul` | Drawer/sheet component for mobile — reserved for the `/compare` mobile UI. |
| `lucide-react` | Icon set. |
| `tw-animate-css` | Tailwind v4-compatible animation utilities (the v4 replacement for `tailwindcss-animate`). |

### Why `@base-ui/react` instead of Radix — the gotcha

If you've seen `shadcn/ui` before, you "know" it's built on **Radix UI**. In
this project it is **not** — it's built on **base-ui** (`@base-ui/react`), a
newer headless-component library from the same team behind Radix and MUI.

This matters because the APIs differ in small, breaking ways. Two you will hit:

1. **`Button` has no `asChild` prop.** With Radix you'd write
   `<Button asChild><Link/></Button>` to make a link *look* like a button.
   base-ui has no `asChild`. Instead you put the *class names* directly on the
   `<Link>`: `<Link className={buttonVariants({ size: "lg" })}>`. You'll see
   exactly this in [src/app/page.tsx](../../src/app/page.tsx).
2. **`TooltipProvider` takes `delay`, not `delayDuration`.**

> **Lesson:** "I've used this library before" is a trap when versions move fast.
> When unsure about a primitive's props, open its source in
> [src/components/ui/](../../src/components/ui/) — you own that code.

### Why Recharts and not visx

The original plan considered `visx` (a lower-level, more flexible D3-based
charting toolkit). It's not installed: its peer dependencies don't accept
React 19 yet. Recharts does. This is a normal real-world tradeoff — the "best"
library doesn't matter if it can't install.

---

## 3. Project configuration files

### [tsconfig.json](../../tsconfig.json)

The TypeScript compiler settings. The two lines worth understanding:

```json
"strict": true,
"paths": { "@/*": ["./src/*"] }
```

- **`strict: true`** turns on all of TypeScript's strict checks (no implicit
  `any`, null-safety, etc.). It's why the data layer is so carefully typed.
- **`paths`** creates the `@/` import alias. `@/lib/metrics` resolves to
  `src/lib/metrics`. This means imports never become `../../../lib/metrics` —
  they're always absolute-looking and stable when files move.

`"moduleResolution": "bundler"` tells TS to resolve imports the way a modern
bundler does (this is the current recommended setting; older projects used
`"node"`).

### [next.config.ts](../../next.config.ts)

```ts
const nextConfig: NextConfig = {
  /* config options here */
};
```

It's **empty** — and that's correct. Phase 0 needs no custom Next.js behavior
(no redirects, no image domains, no experimental flags). An empty config is a
feature: don't add configuration you don't need.

> **Next 16 note:** Turbopack is now the **default** bundler. That's why
> [package.json](../../package.json)'s scripts are plain `next dev` / `next build`
> with no `--turbopack` flag. (CLAUDE.md's command comments mention turbopack —
> that's accurate, it's just on by default now.)

### [postcss.config.mjs](../../postcss.config.mjs)

```js
plugins: { "@tailwindcss/postcss": {} }
```

Tailwind v4 runs as a single PostCSS plugin. In v3 you needed `tailwindcss` +
`autoprefixer` + a JS config file. v4 collapses all of that.

### [components.json](../../components.json)

Configuration for the `shadcn` CLI — tells it where to put generated components
(`@/components/ui`), which style preset to use (`"base-nova"`), and which icon
library (`lucide`). `"rsc": true` means generated components are React Server
Components by default unless they need `"use client"`.

### [eslint.config.mjs](../../eslint.config.mjs)

Uses the modern ESLint "flat config" format and pulls in Next.js's
`core-web-vitals` and `typescript` rule sets. Nothing custom.

---

## 4. Tailwind v4 and the theming system

This is the file most likely to confuse anyone with pre-2025 Tailwind
knowledge: [src/app/globals.css](../../src/app/globals.css). **There is no
`tailwind.config.ts`.** In Tailwind v4, configuration lives *in CSS*.

Walking through it top to bottom:

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";
```

Three imports pull in Tailwind itself, the animation utilities, and shadcn's
base styles. In v3 this was the `@tailwind base/components/utilities`
directives — v4 replaces them with a single `@import`.

```css
@custom-variant dark (&:is(.dark *));
```

This *defines* the `dark:` variant. It says: "a `dark:` utility applies when the
element is inside something with class `.dark`." This is why dark mode is
toggled by putting `class="dark"` on `<html>` (see Section 5).

```css
@theme inline {
  --color-background: var(--background);
  --color-primary: var(--primary);
  --radius-lg: var(--radius);
  ...
}
```

The **`@theme` block is what generates utility classes.** Declaring
`--color-primary` makes `bg-primary`, `text-primary`, `border-primary`, etc.
exist. The `inline` keyword means "these reference other CSS variables, resolve
them inline."

Notice the indirection: `--color-primary` points at `--primary`. Why two
layers?

- `--color-primary` (inside `@theme`) is the **Tailwind-facing** token — it
  creates the utility class.
- `--primary` (inside `:root` / `.dark`) is the **actual value**, and it
  *changes* between light and dark.

So utilities are stable, but the values behind them swap with the theme.

```css
:root  { --primary: oklch(0.205 0 0); ... }
.dark  { --primary: oklch(0.922 0 0); ... }
```

`:root` holds the light-mode values; `.dark` overrides them. When `<html>` has
`class="dark"`, every `--primary` resolves to the dark value, and every
`bg-primary` in the app updates — no JS, no re-render.

**Why `oklch()` instead of hex?** `oklch(lightness chroma hue)` is a
perceptually-uniform color space. Its first number is *lightness* — so flipping
light↔dark is often just "change the lightness number." It also makes
consistent color ramps (the `--chart-1..5` values) much easier to reason about
than hex.

```css
@layer base {
  * { @apply border-border outline-ring/50; }
  body { @apply bg-background text-foreground; }
  html { @apply font-sans; }
}
```

Base-layer defaults: a default border color for everything, the page
background/text colors, and the default font. `@layer base` ensures these have
low CSS priority so component classes always win.

> **Lesson:** When you want a new color or radius token, you add it here — once,
> in CSS. There is no JS config file to touch.

---

## 5. The app shell — [src/app/layout.tsx](../../src/app/layout.tsx)

The root layout wraps **every** page. It renders the `<html>` and `<body>` tags
(in the App Router, you own those).

```ts
const inter = Inter({ variable: "--font-sans", subsets: ["latin"] });
const jetbrainsMono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"] });
```

`next/font/google` downloads these fonts **at build time** and self-hosts them —
no runtime request to Google, no layout shift. The `variable` option exposes
each font as a CSS variable. Those variable names (`--font-sans`, `--font-mono`)
are exactly what the `@theme` block in `globals.css` references — that's how the
font wiring connects.

```ts
export const metadata: Metadata = {
  title: {
    default: "CryptoRadar — Compare coins at a glance",
    template: "%s · CryptoRadar",
  },
  ...
};
```

The `template` is a nice detail: any page that sets its own title as `"Compare"`
automatically renders as `"Compare · CryptoRadar"`. The `default` is used by
pages that set no title.

```tsx
<html lang="en" className={`dark ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning>
```

- `className="dark"` — dark mode is hard-coded on for now (a theme toggle would
  come later). This is the `.dark` class that `@custom-variant` and the `.dark`
  CSS block hook into.
- `${inter.variable}` etc. — this is what actually *activates* the font
  variables on the page.
- `suppressHydrationWarning` — tells React not to warn if the server-rendered
  HTML and the client's first render differ slightly on `<html>`. It's standard
  practice here because theme/font attributes are a known, harmless source of
  that mismatch.

```tsx
<body className="min-h-full flex flex-col font-sans">
  <Providers>{children}</Providers>
</body>
```

The body is a vertical flex column (so pages can use `flex-1` to fill height),
and everything is wrapped in `<Providers>`.

---

## 6. Providers — [src/components/providers.tsx](../../src/components/providers.tsx)

```tsx
"use client";
```

The very first line. **This file is a Client Component.** It must be, because
React Query and the tooltip provider use React Context and hooks, which only run
on the client. Note the split: `layout.tsx` stays a Server Component (good — it
ships no JS), and only this small `Providers` wrapper opts into the client.
That's the standard App Router pattern: keep the server/client boundary as low
and as small as possible.

```tsx
const [queryClient] = useState(
  () => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60 * 1000, refetchOnWindowFocus: false },
    },
  })
);
```

This is a deliberate, important pattern. **Why `useState` with a function?**

If you wrote `const queryClient = new QueryClient()` directly, a *new* client
would be created on every render — throwing away the cache each time.

`useState(() => new QueryClient(...))` calls the factory function **once**, on
first render, and keeps the same instance forever after. The function form
(`() => ...`) means the `QueryClient` isn't even *constructed* on later renders.

The options:
- `staleTime: 60 * 1000` — fetched data is considered "fresh" for 60 seconds;
  within that window React Query won't refetch. Sensible for crypto prices that
  don't need sub-minute precision.
- `refetchOnWindowFocus: false` — don't refetch every time the user tabs back to
  the window. Avoids hammering the API.

```tsx
<TooltipProvider delay={200}>
```

base-ui's prop is `delay` (200ms before a tooltip shows) — **not**
`delayDuration`, which is the Radix name. Same gotcha as Section 2.

---

## 7. The library layer — the core of Phase 0

`src/lib/` is where the real logic lives. These three files are fully written
and type-checked. They're the engine; Phase 1 just builds the routes that turn
the key.

### 7a. [src/lib/metrics.ts](../../src/lib/metrics.ts) — the methodology

This file is the **single source of truth** for the seven radar axes. It was
ported from the original Streamlit Python prototype
([legacy/CryptoRadar.py](../../legacy/CryptoRadar.py)).

```ts
export const CRITERIA = [
  "Market_Cap", "Volume_24h", "Liquidity_Ratio", "Tokenomics_Health",
  "Momentum_7D", "Momentum_30D", "ATH_Recovery",
] as const;

export type Criterion = (typeof CRITERIA)[number];
```

The **`as const`** is doing real work. Without it, TypeScript infers the type of
`CRITERIA` as `string[]`. With it, TS infers the *exact tuple of literal
strings*. That lets the next line, `(typeof CRITERIA)[number]`, extract a precise
union type: `"Market_Cap" | "Volume_24h" | ... | "ATH_Recovery"`.

The payoff: `Criterion` is now a closed set of seven exact strings. Anywhere you
use it, TypeScript catches typos and missing cases at compile time.

```ts
export const MIN_MAX: Record<Criterion, readonly [number, number]> = {
  Market_Cap: [10_000_000, 1_000_000_000_000],
  ...
};
```

`Record<Criterion, ...>` means "an object that **must** have a key for every
`Criterion`." If someone adds an eighth axis to `CRITERIA` but forgets to add
its bounds here, the build fails. The type system enforces completeness.

Each entry is the `[min, max]` bound for that axis — the range used to scale a
raw value into a 0–1 score.

```ts
export function normalize(value, min, max): number {
  if (value === null || value === undefined || Number.isNaN(value)) return 0;
  const n = (value - min) / (max - min);
  return Math.max(0, Math.min(1, n));
}
```

This is **min-max normalization**. Every radar axis must be drawn on the same
0–1 scale, but the raw metrics are wildly different units (market cap in
*billions of dollars*, momentum in *percent*). `normalize` maps any raw value
onto 0–1:

- `(value - min) / (max - min)` — the core formula. If `value === min` → 0; if
  `value === max` → 1; halfway → 0.5.
- `Math.max(0, Math.min(1, n))` — **clamps** the result. A coin with a market
  cap above the `max` bound would compute to >1; clamping pins it at 1 so it
  can't blow past the edge of the radar.
- The null/NaN guard returns 0 — missing data renders as the smallest score
  rather than crashing the chart.

### 7b. [src/lib/coingecko.ts](../../src/lib/coingecko.ts) — the upstream client

```ts
import "server-only";
```

First line, and important. The `server-only` package makes the build **fail** if
this file is ever imported into a Client Component. That's a safety rail: it
guarantees CoinGecko calls (and, later, any API key) never leak into
browser-shipped JavaScript.

```ts
const MarketRow = z.object({
  id: z.string(),
  symbol: z.string(),
  market_cap: z.number().nullable(),
  ...
});
const MarketsResponse = z.array(MarketRow);
export type MarketRow = z.infer<typeof MarketRow>;
```

This is the key idea: **zod schemas validate data at the trust boundary.**

TypeScript types are erased at runtime — they tell you what you *expect*, but
they can't check what an external API *actually* sent. CoinGecko could change a
field, return `null` where you expected a number, or fail. A `zod` schema is a
*runtime* check.

`z.infer<typeof MarketRow>` is the elegant part: it derives the TypeScript type
*from* the schema. You write the shape **once**; you get both runtime validation
and a static type. They can never drift apart.

```ts
async function gecko<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { accept: "application/json" },
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`CoinGecko ${res.status} for ${path}`);
  const json = await res.json();
  return schema.parse(json);
}
```

A single **generic helper** every fetch goes through:

- `<T>` plus `schema: z.ZodType<T>` ties the return type to whatever schema you
  pass. Call it with `MarketsResponse` → you get back `MarketRow[]`, fully typed.
- `next: { revalidate: 0 }` opts this fetch **out** of Next.js's automatic fetch
  caching. Caching is handled deliberately by our own Redis layer
  (Section 7c) — we don't want two caching systems fighting.
- `if (!res.ok) throw` — turns an HTTP error (like a 429 rate-limit) into a
  thrown error. This is what the cache layer will *catch* to trigger its
  stale-fallback.
- `schema.parse(json)` — validates. If CoinGecko's response doesn't match,
  `parse` throws. Bad data is stopped here, not 10 functions deeper.

The three exported fetchers — `fetchCategories`, `fetchTopCoins`,
`fetchCoinMarkets` — are thin wrappers that build the right URL and call
`gecko()`. `fetchCoinMarkets` has a small but smart guard:

```ts
if (ids.length === 0) return [];
```

No coins requested → return empty immediately, skip the network call entirely.

```ts
export function deriveMetrics(row: MarketRow): CoinMetrics {
  const mcap = row.market_cap ?? 0;
  const vol = row.total_volume ?? 0;
  const fdv = row.fully_diluted_valuation ?? mcap;
  return {
    Market_Cap: mcap,
    Volume_24h: vol,
    Liquidity_Ratio: mcap > 0 ? vol / mcap : 0,
    Tokenomics_Health: fdv > 0 ? mcap / fdv : 1,
    Momentum_7D: row.price_change_percentage_7d_in_currency ?? 0,
    Momentum_30D: row.price_change_percentage_30d_in_currency ?? 0,
    ATH_Recovery: row.ath_change_percentage ?? -100,
  };
}
```

This **translates** a raw CoinGecko row into the seven-axis `CoinMetrics`
shape. Two metrics are *computed*, not fetched directly:

- **`Liquidity_Ratio` = volume / market cap.** How much of the coin's value
  trades hands daily — a liquidity proxy.
- **`Tokenomics_Health` = market cap / fully-diluted valuation.** How much of
  the eventual token supply is already circulating. Closer to 1 = less future
  dilution.

Notice the defensive defaults everywhere (`?? 0`, `?? mcap`, the `mcap > 0 ?`
guards). External data is missing-prone; every fallback keeps the math from
producing `NaN` or dividing by zero. `ATH_Recovery` defaults to `-100` (the
worst possible) when absent — a missing value shouldn't look like a *good* score.

### 7c. [src/lib/cache.ts](../../src/lib/cache.ts) — the caching layer

CoinGecko's free API rate-limits aggressively. This file sits between our routes
and CoinGecko so we call upstream as little as possible.

```ts
let _redis: Redis | null = null;

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  if (!_redis) _redis = new Redis({ url, token });
  return _redis;
}
```

A **lazy singleton**. The `Redis` client is created on first use and reused
after (`_redis` holds it). And if the env vars aren't set, it returns `null`
instead of crashing — that powers the graceful-degradation path below. This is
why you can clone the repo and run it with no Redis account
(see [.env.example](../../.env.example)).

```ts
type CachedEnvelope<T> = { value: T; cachedAt: number };

export type CacheResult<T> =
  | { value: T; stale: false; cachedAt: number | null }
  | { value: T; stale: true;  cachedAt: number };
```

Two types worth noticing:

- **`CachedEnvelope`** — we never store the raw value in Redis; we wrap it with a
  `cachedAt` timestamp. That's metadata the UI can use ("updated 3 min ago").
- **`CacheResult`** is a *discriminated union*. The `stale` boolean is the
  discriminant. When `stale: true`, TypeScript *knows* `cachedAt` is a `number`,
  not `number | null`. The types make the two outcomes precise.

```ts
export async function withCache<T>(key, ttlSeconds, fetcher): Promise<CacheResult<T>> {
  const redis = getRedis();

  if (!redis) {
    const value = await fetcher();
    return { value, stale: false, cachedAt: null };
  }
```

**Path 1 — no Redis configured.** Just run the fetcher and return. The app works
without a cache; it'll just hit CoinGecko more often. Graceful degradation.

```ts
  const hit = await redis.get<CachedEnvelope<T>>(key);
  if (hit) return { value: hit.value, stale: false, cachedAt: hit.cachedAt };
```

**Path 2 — cache hit.** Found it in Redis → return immediately, no upstream
call. The fast, common path.

```ts
  try {
    const value = await fetcher();
    const envelope = { value, cachedAt: Date.now() };
    await redis.set(key, envelope, { ex: ttlSeconds });
    return { value, stale: false, cachedAt: envelope.cachedAt };
  } catch (err) {
    const stale = await redis.get<CachedEnvelope<T>>(`${key}:stale`);
    if (stale) return { value: stale.value, stale: true, cachedAt: stale.cachedAt };
    throw err;
  }
}
```

**Path 3 — cache miss.** Call CoinGecko, store the result with a TTL
(`ex: ttlSeconds` = expire after N seconds), return it.

**Path 4 — cache miss *and* the fetch throws** (e.g. CoinGecko returns 429).
Instead of failing the user's request, it looks for a **`:stale` key** — a
last-known-good copy — and serves that with `stale: true`. The UI can then show
the data with a "may be out of date" indicator (the plan calls this the
`X-Stale: true` response header). Only if there's *no* stale copy at all does it
give up and re-throw.

> **Note:** writing the `:stale` key isn't in this file yet — Phase 1's route
> handlers (or a warm-up job) will populate it. The *read* side of the
> stale-fallback is built; the write side is a Phase 1 task.

---

## 8. The stub pages

Four pages exist so the routes and navigation work. They render placeholders.

### [src/app/page.tsx](../../src/app/page.tsx) — the landing page

A Server Component (no `"use client"`, no hooks). The detail to learn:

```tsx
<Link href="/compare" className={buttonVariants({ size: "lg" })}>
  Open the radar
</Link>
```

This is the **base-ui "no `asChild`" workaround** from Section 2 in practice.
`buttonVariants(...)` is a `cva` function that returns the *class-name string*
for a large button. Putting that string on `<Link>` makes the link *look*
exactly like a button while staying a real `<a>` for navigation and
accessibility.

### [src/app/coin/[id]/page.tsx](../../src/app/coin/[id]/page.tsx) — the dynamic route

```tsx
type Params = Promise<{ id: string }>;

export default async function CoinPage({ params }: { params: Params }) {
  const { id } = await params;
  ...
}
```

**The Next.js gotcha.** In older Next.js, `params` was a plain object — you'd
write `params.id` directly. In Next 15+, **`params` is a `Promise`.** You must:

1. type it as `Promise<{ id: string }>`,
2. make the component `async`,
3. `await params` before reading `id`.

If your training data predates this change, you'll write `params.id` and get a
confusing type error. The folder name `[id]` is what makes the route dynamic —
`/coin/bitcoin` puts `"bitcoin"` into `params.id`.

### [src/app/compare/page.tsx](../../src/app/compare/page.tsx)

Lays out the eventual two-column compare UI (a 260px sidebar + the radar area)
using `Skeleton` components as placeholders. Good practice: the *layout* is real
even though the content is fake, so wiring it up in Phase 1 won't shift the page
around.

### [src/app/methodology/page.tsx](../../src/app/methodology/page.tsx)

The one stub page that's actually **functional**. It imports `CRITERIA`,
`CRITERION_LABEL`, and `MIN_MAX` from [metrics.ts](../../src/lib/metrics.ts) and
renders them as a table. This proves the point from Section 7a: `metrics.ts` is
the single source of truth, and the methodology page *reads from it* rather than
duplicating the numbers. Change a bound in `metrics.ts` and this table updates
for free.

---

## 9. The intended data flow

Once Phase 1 adds the route handlers, a request will flow like this:

```
Browser
  │  fetch("/api/coins")
  ▼
Next.js route handler  (src/app/api/*  — NOT BUILT YET, Phase 1)
  │  withCache(key, ttl, fetcher)
  ▼
Upstash Redis  (src/lib/cache.ts)
  │  cache miss?
  ▼
CoinGecko  (src/lib/coingecko.ts)
```

The key design rule: **the browser never calls CoinGecko directly.** Every
request goes through our own `/api/*` layer, which means:

- The cache can do its job (the browser can't share a Redis cache).
- An API key, if added, stays server-side.
- Responses can be reshaped/trimmed before reaching the client.

Phase 0 built the bottom two boxes (`cache.ts`, `coingecko.ts`). Phase 1 builds
the middle box — the route handlers — which is why it's the natural next step.

---

## 10. "Not the Next.js you know" — gotcha checklist

A consolidated list of every convention in this project that differs from
older training data. [AGENTS.md](../../AGENTS.md) exists precisely to flag this.

| Area | Old assumption | This project |
|---|---|---|
| Tailwind config | `tailwind.config.ts` | CSS-only: `@theme` in [globals.css](../../src/app/globals.css) |
| Tailwind entry | `@tailwind base/components/utilities` | single `@import "tailwindcss"` |
| Route `params` | plain object, `params.id` | a `Promise`, `await params` first |
| shadcn base | Radix UI | base-ui (`@base-ui/react`) |
| Button + link | `<Button asChild>` | `buttonVariants()` on `<Link>` |
| Tooltip delay | `delayDuration` | `delay` |
| Bundler | webpack, opt-in turbopack | Turbopack is the default |
| Charts | visx (can't do React 19) | Recharts |

> When in doubt about Next.js itself, the installed docs are the truth:
> `node_modules/next/dist/docs/`. About a UI primitive: read its source in
> `src/components/ui/`.

A documentation nit found while writing this: `CLAUDE.md` says "Next.js 15", but
[package.json](../../package.json) pins `next@16.2.6`. The behaviors above
(Promise `params`, default Turbopack) are all Next 16. Worth correcting in
`CLAUDE.md` later.

---

## 11. What Phase 0 deliberately deferred → Phase 1

Phase 0 left the engine built but unstarted. Phase 1, per `CLAUDE.md`, picks up:

1. **API route handlers** — `src/app/api/coins/` and `src/app/api/coin/[id]/`,
   wrapping the `fetch*` helpers in `withCache` and emitting `X-Stale: true` on
   the fallback path. *This is the missing middle box from Section 9.*
2. **The radar chart** — `src/components/radar/`, built on Recharts, fed by
   `normalize()` + `MIN_MAX`.
3. **The coin picker** — `src/components/coin-picker/`, built on `cmdk`.
4. **A mobile sheet** on `/compare`, built on the `Sheet` primitive.

Everything in Phase 1 plugs into wiring Phase 0 already laid down — which was
the entire point of doing a scaffold first.
