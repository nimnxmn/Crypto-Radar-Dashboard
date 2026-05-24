"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontalIcon } from "lucide-react";
import { CoinPicker } from "@/components/coin-picker/CoinPicker";
import { RadarChart, type RadarCoin } from "@/components/radar/RadarChart";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type CoinData = {
  id: string;
  name: string;
  symbol: string;
  normalized: Record<string, number>;
};

function useCoinsData(ids: string[]) {
  return useQuery<RadarCoin[]>({
    queryKey: ["coins-data", [...ids].sort().join(",")],
    queryFn: () =>
      Promise.all(
        ids.map((id) =>
          fetch(`/api/coin/${id}`).then((r) => r.json() as Promise<CoinData>)
        )
      ).then((results) =>
        results.map(({ id, name, normalized }) => ({ id, name, normalized }))
      ),
    enabled: ids.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}

export default function ComparePage() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { data: coins, isFetching } = useCoinsData(selectedIds);

  const picker = (
    <CoinPicker selected={selectedIds} onChange={setSelectedIds} />
  );

  return (
    <main className="flex flex-1 flex-col gap-6 px-6 py-10 max-w-7xl mx-auto w-full">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight">Compare</h1>
          <p className="text-sm text-muted-foreground">
            Pick up to 5 coins to compare on the radar.
          </p>
        </div>

        {/* Mobile sheet trigger */}
        <div className="lg:hidden shrink-0">
          <Sheet>
            <SheetTrigger
              render={
                <Button variant="outline" className="gap-2" />
              }
            >
              <SlidersHorizontalIcon className="size-4" />
              Coins
              {selectedIds.length > 0 && (
                <span className="font-mono text-xs tabular-nums">
                  ({selectedIds.length})
                </span>
              )}
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[80dvh]">
              <SheetHeader className="pb-0">
                <SheetTitle>Select coins</SheetTitle>
              </SheetHeader>
              <div className="overflow-y-auto p-4 pt-2">{picker}</div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex flex-col gap-3">{picker}</aside>

        {/* Radar */}
        <section className="aspect-square w-full max-w-[640px] mx-auto rounded-xl border border-border bg-card overflow-hidden">
          {selectedIds.length === 0 ? (
            <div className="flex h-full items-center justify-center p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Search and select coins on the{" "}
                <span className="hidden lg:inline">left</span>
                <span className="lg:hidden">top</span> to see the radar.
              </p>
            </div>
          ) : isFetching ? (
            <Skeleton className="h-full w-full rounded-xl" />
          ) : coins && coins.length > 0 ? (
            <RadarChart coins={coins} />
          ) : null}
        </section>
      </div>
    </main>
  );
}
