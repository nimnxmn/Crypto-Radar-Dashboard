import { NextResponse } from "next/server";
import { fetchTopCoins } from "@/lib/coingecko";
import { withCache } from "@/lib/cache";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") ?? undefined;

  const key = category ? `coins:top100:${category}` : "coins:top100";

  try {
    const result = await withCache(key, 300, () => fetchTopCoins(category));

    const coins = result.value.map(({ id, symbol, name, image }) => ({
      id,
      symbol,
      name,
      image,
    }));

    const res = NextResponse.json({ coins, cachedAt: result.cachedAt });
    if (result.stale) res.headers.set("X-Stale", "true");
    return res;
  } catch {
    return NextResponse.json({ error: "Failed to fetch coins" }, { status: 503 });
  }
}
