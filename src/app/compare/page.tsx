import { Skeleton } from "@/components/ui/skeleton";

export default function ComparePage() {
  return (
    <main className="flex flex-1 flex-col gap-6 px-6 py-10 max-w-7xl mx-auto w-full">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">Compare</h1>
        <p className="text-sm text-muted-foreground">
          Pick up to 5 coins. The radar is wired up in Phase 1.
        </p>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        <aside className="flex flex-col gap-3">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </aside>
        <section className="aspect-square w-full max-w-[640px] mx-auto rounded-xl border border-border bg-card flex items-center justify-center">
          <span className="font-mono text-xs text-muted-foreground">
            radar placeholder
          </span>
        </section>
      </div>
    </main>
  );
}
