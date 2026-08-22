/**
 * OWNER: Nidhish (Person B)
 */
import { mediaUrl } from "../../utils/format.ts";

type Presence = "present" | "on_leave" | "absent" | "unknown";

export function EmployeeCard({
  name,
  position,
  presence,
  avatarUrl,
  onClick,
}: {
  name: string;
  position?: string | null;
  presence?: Presence;
  avatarUrl?: string | null;
  onClick?: () => void;
}) {
  const color =
    presence === "present"
      ? "bg-[var(--color-success)]"
      : presence === "on_leave"
        ? "bg-purple-500"
        : presence === "absent"
          ? "bg-amber-400"
          : "bg-zinc-600";

  const src = mediaUrl(avatarUrl ?? null);

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left transition hover:border-[var(--color-accent)]"
    >
      <span
        className={`absolute right-3 top-3 h-2.5 w-2.5 rounded-full ${color}`}
        title={presence ?? "unknown"}
      />
      <div className="flex items-center gap-3 pr-4">
        {src ? (
          <img src={src} alt="" className="h-12 w-12 rounded-full object-cover" />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-bg)] text-sm font-semibold text-[var(--color-muted)]">
            {name
              .split(/\s+/)
              .map((p) => p[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
        )}
        <div>
          <p className="font-semibold">{name}</p>
          <p className="text-sm text-[var(--color-muted)]">{position ?? "—"}</p>
        </div>
      </div>
    </button>
  );
}
