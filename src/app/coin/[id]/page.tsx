type Params = Promise<{ id: string }>;

export default async function CoinPage({ params }: { params: Params }) {
  const { id } = await params;
  return (
    <main className="flex flex-1 flex-col gap-6 px-6 py-10 max-w-7xl mx-auto w-full">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight font-mono">
          {id}
        </h1>
        <p className="text-sm text-muted-foreground">
          Coin detail page placeholder. Wired up in Phase 2.
        </p>
      </header>
    </main>
  );
}
