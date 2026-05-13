import { CRITERIA, CRITERION_LABEL, MIN_MAX } from "@/lib/metrics";

export default function MethodologyPage() {
  return (
    <main className="flex flex-1 flex-col gap-6 px-6 py-10 max-w-3xl mx-auto w-full">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">Methodology</h1>
        <p className="text-sm text-muted-foreground">
          Every axis on the radar is a min-max normalized score over the bounds
          below. Bounds are static for now and may move to data-driven
          percentiles in a later iteration.
        </p>
      </header>
      <table className="w-full text-sm font-mono">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="py-2 pr-4 font-normal">Metric</th>
            <th className="py-2 pr-4 font-normal">Min</th>
            <th className="py-2 font-normal">Max</th>
          </tr>
        </thead>
        <tbody>
          {CRITERIA.map((c) => (
            <tr key={c} className="border-b border-border/60">
              <td className="py-2 pr-4 font-sans">{CRITERION_LABEL[c]}</td>
              <td className="py-2 pr-4">{MIN_MAX[c][0].toLocaleString()}</td>
              <td className="py-2">{MIN_MAX[c][1].toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
