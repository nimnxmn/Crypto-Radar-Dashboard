# Phase 1 deep dive — API routes, Recharts radar, cmdk coin picker

Phase 1 turns the Phase 0 skeleton into a working page. After this phase the `/compare` route fetches real data, renders a radar chart with up to five coins overlaid, and adapts its layout between desktop (sidebar picker) and mobile (bottom sheet picker).

Here is every file that was touched or created, why it was written the way it was, and the gotcha that would trip up a newer dev.

---

## `src/app/api/coins/route.ts` — the list endpoint

**What it is.** A Next.js [Route Handler](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) at `/api/coins`. It returns the top 100 coins (id, name, symbol, image) so the coin-picker dropdown has something to search.

**Why it's written this way.** Route handlers in the App Router live at `src/app/api/<path>/route.ts` and export named HTTP-verb functions (`GET`, `POST`, …). There is no Express-style `req`/`res` — the first argument is a Web `Request` object and you return a Web `Response` (or `NextResponse` which wraps it).

```ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  ...
  return NextResponse.json({ coins, cachedAt: result.cachedAt });
}
```

The handler shells out to `withCache` (Redis TTL 5 min) → `fetchTopCoins` (CoinGecko). Clients never call CoinGecko directly — that keeps the API key out of the browser and lets the cache absorb repeated searches.

**Gotcha.** Route handlers that use `"server-only"` imports (like `cache.ts` and `coingecko.ts`) must live in the `app/` tree, not in `src/lib/`. If you put the fetching logic directly inside a component file you'll get a server/client boundary error as soon as that component is imported from a `"use client"` subtree. The split — library code in `src/lib/`, HTTP surface in `src/app/api/` — is what keeps that boundary clean.

---

## `src/app/api/coin/[id]/route.ts` — the per-coin metrics endpoint

**What it is.** A dynamic route handler at `/api/coin/:id`. It fetches market data for a single coin, runs it through `deriveMetrics` and `normalize`, and returns both the raw numbers and the 0–1 normalized values that the chart needs.

**Why it's written this way.** The chart only needs normalized values (0–1 per axis). But we return raw `metrics` too so a future detail page can display the actual numbers (market cap in USD, etc.) without a second fetch.

```ts
const normalized = Object.fromEntries(
  CRITERIA.map((c) => [c, normalize(metrics[c], MIN_MAX[c][0], MIN_MAX[c][1])])
);
```

`Object.fromEntries(array.map(...))` is idiomatic here — it's a one-shot transform from an array of `[key, value]` pairs into an object, readable without a `reduce`.

**Gotcha.** `fetchCoinMarkets` (not `fetchTopCoins`) is used here, because it passes `price_change_percentage: "7d,30d"` to CoinGecko. Without that param, `price_change_percentage_7d_in_currency` and `_30d_in_currency` come back `null`, which collapses `Momentum_7D` and `Momentum_30D` to 0 on every coin — making those two axes useless. `fetchTopCoins` omits those params on purpose (the list endpoint doesn't need momentum; the detail endpoint does).

---

## `src/components/radar/RadarChart.tsx` — the Recharts radar

**What it is.** A `"use client"` component that wraps Recharts' `RadarChart` to visualise up to five coins overlaid on a seven-axis spider chart.

**Why it's written this way.** Recharts expects the chart data as an **array of axis-objects**, not as per-coin series. Each object represents one axis and holds one value per coin keyed by coin ID:

```ts
// Result shape: [{ axis: "Market Cap", bitcoin: 0.91, ethereum: 0.62 }, ...]
const data = CRITERIA.map((criterion) => {
  const point: Record<string, string | number> = { axis: CRITERION_LABEL[criterion] };
  for (const coin of coins) {
    point[coin.id] = coin.normalized[criterion] ?? 0;
  }
  return point;
});
```

Then each `<Radar>` component gets its own `dataKey` (the coin ID) so Recharts draws one polygon per coin:

```tsx
{coins.map((coin, i) => (
  <Radar key={coin.id} name={coin.name} dataKey={coin.id} ... />
))}
```

The colour palette (`PALETTE`) maps to the five `--color-chart-*` CSS variables defined in `globals.css`. That means the chart colours automatically respect any future theme change — no hardcoded hex values.

**Gotcha: `ResponsiveContainer` needs a sized parent.** `ResponsiveContainer width="100%" height="100%"` measures its parent's computed dimensions. If the parent has no explicit height (e.g., `height: auto` from the default block flow), the container gets 0 height and the chart is invisible. The fix in the compare page is `aspect-square` on the `<section>`, which forces a square based on the element's computed width. Always give `ResponsiveContainer` a parent with a definite height or use `aspect-ratio`.

**Gotcha: CSS variables in Recharts props.** Recharts renders SVG. Some SVG attributes (like `fill`, `stroke`) accept `var(--color-x)` fine. But `tick={{ fill: "var(--color-muted-foreground)" }}` renders into SVG text elements where CSS custom properties are resolved by the browser — so this works. However, if you put a custom property in a `wrapperStyle` on a non-SVG element (like `Legend`), it also works since that's rendered in HTML. The split between SVG and HTML context is something to be aware of when debugging colour issues.

---

## `src/components/coin-picker/CoinPicker.tsx` — the cmdk multi-select

**What it is.** A `"use client"` component that fetches `/api/coins`, renders a searchable command palette using the `Command` primitives from `src/components/ui/command.tsx`, and lets the user toggle up to five coins.

**Why it's written this way.** cmdk (`Command*` components) handles fuzzy search, keyboard navigation, and ARIA attributes for free. The `value` prop on `CommandItem` is what cmdk fuzzes against — we set it to `"${coin.name} ${coin.symbol}"` so you can type either "Bitcoin" or "BTC" and find the same result.

```tsx
<CommandItem
  value={`${coin.name} ${coin.symbol}`}
  onSelect={() => toggle(coin.id)}
  data-checked={isSelected}
  disabled={isDisabled}
>
```

`data-checked` is read by the `CommandItem` style in `ui/command.tsx` to render the checkmark. `disabled` prevents selecting a sixth coin without any JS guard logic in the toggle function.

State is lifted to the parent (`ComparePage`) so the same `selected` array can drive both the picker and the chart. The picker itself is stateless — it just calls `onChange`.

**Gotcha: `useQuery` fetches once and caches.** The coin list is fetched with `staleTime: 5 * 60 * 1000`. Tanstack Query holds the result in memory across component unmounts (the Sheet closing, for example), so re-opening the Sheet on mobile does not trigger a second network call. Without `staleTime`, every mount would refetch — 100 coins per interaction.

**Gotcha: `Command` `overflow-visible`.** The default `Command` wraps a scrollable list inside `overflow-hidden`. If the component is inside a container that clips, the list will be visually cut off. The className `overflow-visible` overrides this for the inline (non-dialog) variant used in the sidebar. In the Sheet on mobile, the Sheet itself provides the scroll boundary.

---

## `src/app/compare/page.tsx` — wiring it together

**What it is.** The compare route, rebuilt from the Phase 0 skeleton into a live client component with state, data fetching, and a responsive layout.

**Why `"use client"`.** The page manages `selectedIds` with `useState`, which requires a client component. In Next.js App Router, a page that owns state must be `"use client"`. The trade-off is that no part of this page is server-rendered — but since the data is user-specific (depends on which coins they pick) there is nothing to server-render anyway.

**The `useCoinsData` hook.** Rather than calling `useQuery` in a loop (illegal — hooks can't be called conditionally or in array iteration), we merge all selected IDs into one `queryKey` and batch the fetches with `Promise.all`:

```ts
function useCoinsData(ids: string[]) {
  return useQuery<RadarCoin[]>({
    queryKey: ["coins-data", [...ids].sort().join(",")],
    queryFn: () =>
      Promise.all(ids.map((id) => fetch(`/api/coin/${id}`).then(r => r.json()))),
    enabled: ids.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}
```

The key uses `[...ids].sort()` so `["bitcoin","ethereum"]` and `["ethereum","bitcoin"]` hit the same cache entry — order doesn't matter for the chart.

**Desktop/mobile layout.** On large screens the layout is `grid-cols-[260px_1fr]`: a fixed-width sidebar with the picker and an expanding chart area. On small screens it collapses to a single column. The picker is moved into a `Sheet` (bottom drawer) triggered by a button in the header.

The same `picker` JSX node is passed to **both** the sidebar and the Sheet:

```tsx
const picker = <CoinPicker selected={selectedIds} onChange={setSelectedIds} />;

// Desktop
<aside className="hidden lg:flex ...">{picker}</aside>

// Mobile
<SheetContent ...><div ...>{picker}</div></SheetContent>
```

React renders two separate instances of the component — but because `useQuery` caches results by key, both instances share the fetched coin list without a duplicate network call.

**Gotcha: `SheetTrigger render` prop.** The base-ui `Dialog.Trigger` (which `SheetTrigger` wraps) renders as a plain `<button>` by default. Nesting our styled `<Button>` component inside it would create a `<button><button>` — invalid HTML and a screen-reader trap. The `render` prop replaces the trigger's root element entirely:

```tsx
<SheetTrigger render={<Button variant="outline" className="gap-2" />}>
  ...children...
</SheetTrigger>
```

This is how base-ui handles the "slot" pattern that Radix handled with `asChild`. If you're used to Radix, this is the thing most likely to trip you up.

---

## What was intentionally left alone

**`src/lib/cache.ts` — the stale key is never written.** The architecture doc describes a last-known-good fallback when CoinGecko returns 429. In `cache.ts` the `catch` block reads from `${key}:stale`, but nothing ever writes to that key. The fallback silently does nothing today. This is a Phase 2 fix — add `await redis.set(`${key}:stale`, envelope, { ex: ttlSeconds * 12 })` right after storing the fresh value if you want the 429 guard to actually work.

---

## What's next — Phase 2

- `/coin/[id]` detail page: sparkline (7-day price history from CoinGecko `/coins/{id}/market_chart`), raw metric table, and the radar for a single coin.
- PNG snapshot export of the radar (html2canvas or a server-side `@resvg/resvg-js` render of the SVG).
- Preset chips ("Top 5 by market cap", "DeFi picks") that pre-fill `selectedIds`.
- Skeleton states while data loads (replacing the current `<Skeleton>` placeholder with shape-accurate skeletons).
