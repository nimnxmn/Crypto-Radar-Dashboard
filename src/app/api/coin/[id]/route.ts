import { NextResponse } from "next/server";
import { fetchCoinMarkets, deriveMetrics } from "@/lib/coingecko";
import { withCache } from "@/lib/cache";
import { CRITERIA, MIN_MAX, normalize } from "@/lib/metrics";

type Params = Promise<{ id: string }>;

export async function GET(_req: Request, { params }: { params: Params }) {
  const { id } = await params;

  try {
    const result = await withCache(`coin:${id}`, 300, async () => {
      const rows = await fetchCoinMarkets([id]);
      if (!rows[0]) throw new Error(`Coin ${id} not found`);
      return rows[0];
    });

    const row = result.value;
    const metrics = deriveMetrics(row);

    const normalized = Object.fromEntries(
      CRITERIA.map((c) => [c, normalize(metrics[c], MIN_MAX[c][0], MIN_MAX[c][1])])
    );

    const res = NextResponse.json({
      id: row.id,
      name: row.name,
      symbol: row.symbol,
      image: row.image,
      metrics,
      normalized,
      cachedAt: result.cachedAt,
    });
    if (result.stale) res.headers.set("X-Stale", "true");
    return res;
  } catch {
    return NextResponse.json({ error: "Coin not found" }, { status: 404 });
  }
}
