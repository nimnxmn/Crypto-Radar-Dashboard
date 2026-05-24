"use client";

import { useQuery } from "@tanstack/react-query";
import { XIcon } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";

type CoinSummary = {
  id: string;
  name: string;
  symbol: string;
  image?: string;
};

type Props = {
  selected: string[];
  onChange: (ids: string[]) => void;
  max?: number;
};

export function CoinPicker({ selected, onChange, max = 5 }: Props) {
  const { data, isLoading } = useQuery<{ coins: CoinSummary[] }>({
    queryKey: ["coins"],
    queryFn: () => fetch("/api/coins").then((r) => r.json()),
    staleTime: 5 * 60 * 1000,
  });

  const coins = data?.coins ?? [];

  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else if (selected.length < max) {
      onChange([...selected, id]);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((id) => {
            const coin = coins.find((c) => c.id === id);
            return (
              <Badge key={id} variant="secondary" className="gap-1 pr-1">
                {coin?.name ?? id}
                <button
                  onClick={() => onChange(selected.filter((s) => s !== id))}
                  className="ml-0.5 rounded-sm opacity-70 hover:opacity-100 focus:outline-none"
                  aria-label={`Remove ${coin?.name ?? id}`}
                >
                  <XIcon className="size-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      <Command className="border border-border rounded-lg overflow-visible">
        <CommandInput placeholder="Search coins…" />
        <CommandList className="max-h-60">
          <CommandEmpty>
            {isLoading ? "Loading…" : "No coins found."}
          </CommandEmpty>
          <CommandGroup>
            {coins.map((coin) => {
              const isSelected = selected.includes(coin.id);
              const isDisabled = !isSelected && selected.length >= max;
              return (
                <CommandItem
                  key={coin.id}
                  value={`${coin.name} ${coin.symbol}`}
                  onSelect={() => toggle(coin.id)}
                  data-checked={isSelected}
                  disabled={isDisabled}
                  className="gap-2"
                >
                  {coin.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={coin.image}
                      alt=""
                      className="size-4 rounded-full shrink-0"
                    />
                  ) : (
                    <span className="size-4 rounded-full bg-muted shrink-0" />
                  )}
                  <span className="truncate">{coin.name}</span>
                  <span className="ml-auto font-mono text-xs text-muted-foreground shrink-0">
                    {coin.symbol.toUpperCase()}
                  </span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </Command>

      {selected.length >= max && (
        <p className="text-xs text-muted-foreground">
          Max {max} coins selected.
        </p>
      )}
    </div>
  );
}
