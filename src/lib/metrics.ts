export const CRITERIA = [
  "Market_Cap",
  "Volume_24h",
  "Liquidity_Ratio",
  "Tokenomics_Health",
  "Momentum_7D",
  "Momentum_30D",
  "ATH_Recovery",
] as const;

export type Criterion = (typeof CRITERIA)[number];

export const MIN_MAX: Record<Criterion, readonly [number, number]> = {
  Market_Cap: [10_000_000, 1_000_000_000_000],
  Volume_24h: [1_000_000, 50_000_000_000],
  Liquidity_Ratio: [0.01, 0.5],
  Tokenomics_Health: [0.1, 1.0],
  Momentum_7D: [-30, 50],
  Momentum_30D: [-50, 100],
  ATH_Recovery: [-100, 0],
};

export const CRITERION_LABEL: Record<Criterion, string> = {
  Market_Cap: "Market Cap",
  Volume_24h: "Volume 24h",
  Liquidity_Ratio: "Liquidity Ratio",
  Tokenomics_Health: "Tokenomics Health",
  Momentum_7D: "Momentum 7D",
  Momentum_30D: "Momentum 30D",
  ATH_Recovery: "ATH Recovery",
};

export function normalize(
  value: number | null | undefined,
  min: number,
  max: number
): number {
  if (value === null || value === undefined || Number.isNaN(value)) return 0;
  const n = (value - min) / (max - min);
  return Math.max(0, Math.min(1, n));
}

export type CoinMetrics = Record<Criterion, number>;
