import "server-only";
import { z } from "zod";
import type { CoinMetrics } from "./metrics";

const BASE = "https://api.coingecko.com/api/v3";

const MarketRow = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  image: z.string().url().optional(),
  market_cap: z.number().nullable(),
  total_volume: z.number().nullable(),
  fully_diluted_valuation: z.number().nullable(),
  price_change_percentage_7d_in_currency: z.number().nullable().optional(),
  price_change_percentage_30d_in_currency: z.number().nullable().optional(),
  ath_change_percentage: z.number().nullable(),
});

const MarketsResponse = z.array(MarketRow);

export type MarketRow = z.infer<typeof MarketRow>;

const Category = z.object({
  category_id: z.string(),
  name: z.string(),
});
const CategoriesResponse = z.array(Category);

export type Category = z.infer<typeof Category>;

async function gecko<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { accept: "application/json" },
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    throw new Error(`CoinGecko ${res.status} for ${path}`);
  }
  const json = await res.json();
  return schema.parse(json);
}

export async function fetchCategories(): Promise<Category[]> {
  return gecko("/coins/categories/list", CategoriesResponse);
}

export async function fetchTopCoins(categoryId?: string): Promise<MarketRow[]> {
  const params = new URLSearchParams({
    vs_currency: "usd",
    order: "market_cap_desc",
    per_page: "100",
    page: "1",
  });
  if (categoryId) params.set("category", categoryId);
  return gecko(`/coins/markets?${params}`, MarketsResponse);
}

export async function fetchCoinMarkets(ids: string[]): Promise<MarketRow[]> {
  if (ids.length === 0) return [];
  const params = new URLSearchParams({
    vs_currency: "usd",
    ids: ids.join(","),
    price_change_percentage: "7d,30d",
  });
  return gecko(`/coins/markets?${params}`, MarketsResponse);
}

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
