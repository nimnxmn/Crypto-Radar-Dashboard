"use client";

import {
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { CRITERIA, CRITERION_LABEL } from "@/lib/metrics";

const PALETTE = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

export type RadarCoin = {
  id: string;
  name: string;
  normalized: Record<string, number>;
};

export function RadarChart({ coins }: { coins: RadarCoin[] }) {
  const data = CRITERIA.map((criterion) => {
    const point: Record<string, string | number> = {
      axis: CRITERION_LABEL[criterion],
    };
    for (const coin of coins) {
      point[coin.id] = coin.normalized[criterion] ?? 0;
    }
    return point;
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsRadarChart
        data={data}
        margin={{ top: 24, right: 32, bottom: 24, left: 32 }}
      >
        <PolarGrid stroke="var(--color-border)" />
        <PolarAngleAxis
          dataKey="axis"
          tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
        />
        <PolarRadiusAxis
          domain={[0, 1]}
          tickCount={4}
          tick={{ fill: "var(--color-muted-foreground)", fontSize: 9 }}
          axisLine={false}
        />
        {coins.map((coin, i) => (
          <Radar
            key={coin.id}
            name={coin.name}
            dataKey={coin.id}
            stroke={PALETTE[i % PALETTE.length]}
            fill={PALETTE[i % PALETTE.length]}
            fillOpacity={0.15}
            strokeWidth={2}
          />
        ))}
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          formatter={(value) => (
            <span style={{ color: "var(--color-foreground)" }}>{value}</span>
          )}
        />
        <Tooltip
          contentStyle={{
            background: "var(--color-popover)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            fontSize: 12,
          }}
          formatter={(value) =>
            typeof value === "number"
              ? [`${(value * 100).toFixed(0)}%`]
              : [String(value)]
          }
        />
      </RechartsRadarChart>
    </ResponsiveContainer>
  );
}
