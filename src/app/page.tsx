import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <div className="flex flex-col items-center gap-6 text-center max-w-2xl">
        <Badge variant="secondary" className="font-mono text-xs">
          v0.1 · Phase 0 scaffold
        </Badge>
        <h1 className="text-5xl font-semibold tracking-tight">
          A coin&apos;s market profile,{" "}
          <span className="text-muted-foreground">at a glance.</span>
        </h1>
        <p className="text-lg text-muted-foreground">
          CryptoRadar turns seven market metrics into a visual fingerprint, so
          you can compare projects without scanning tables of numbers.
        </p>
        <div className="flex gap-3 pt-2">
          <Link href="/compare" className={buttonVariants({ size: "lg" })}>
            Open the radar
          </Link>
          <Link
            href="/methodology"
            className={buttonVariants({ size: "lg", variant: "outline" })}
          >
            How it works
          </Link>
        </div>
      </div>
    </main>
  );
}
