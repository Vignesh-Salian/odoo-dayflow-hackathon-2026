export function PlaceholderPage({ title, note }: { title: string; note: string }) {
  return (
    <section className="space-y-3">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
        {title}
      </h1>
      <p className="max-w-xl text-[var(--color-muted)]">{note}</p>
    </section>
  );
}
