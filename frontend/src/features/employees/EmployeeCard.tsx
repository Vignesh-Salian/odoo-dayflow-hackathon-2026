/**
 * OWNER: Nidhish (Person B)
 */
type Presence = "present" | "on_leave" | "absent" | "unknown";

export function EmployeeCard({
  name,
  position,
  presence,
  onClick,
}: {
  name: string;
  position?: string | null;
  presence?: Presence;
  onClick?: () => void;
}) {
  const color =
    presence === "present"
      ? "bg-[var(--color-success)]"
      : presence === "on_leave"
        ? "bg-zinc-400"
        : presence === "absent"
          ? "bg-amber-400"
          : "bg-zinc-600";

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left transition hover:border-[var(--color-accent)]"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold">{name}</p>
          <p className="text-sm text-[var(--color-muted)]">{position ?? "—"}</p>
        </div>
        <span className={`mt-1 h-2.5 w-2.5 rounded-full ${color}`} title={presence ?? "unknown"} />
      </div>
    </button>
  );
}
