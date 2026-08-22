/**
 * OWNER: Nidhish (Person B)
 */
import { mediaUrl } from "../../utils/format.ts";

type Presence = "present" | "on_leave" | "absent" | "unknown";

const presenceMeta: Record<Presence, { color: string; label: string }> = {
  present: { color: "bg-[var(--color-success)]", label: "Present" },
  on_leave: { color: "bg-[var(--color-accent)]", label: "On leave" },
  absent: { color: "bg-[var(--color-warning)]", label: "Absent" },
  unknown: { color: "bg-[var(--color-muted)]", label: "Unknown" },
};

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
  const meta = presenceMeta[presence ?? "unknown"];
  const src = mediaUrl(avatarUrl ?? null);

  return (
    <button
      type="button"
      onClick={onClick}
      className="df-card group relative w-full p-4 text-left transition hover:-translate-y-0.5 hover:border-[var(--color-accent)]/40"
    >
      <span
        className={`absolute right-3 top-3 h-2.5 w-2.5 rounded-full ${meta.color} ring-2 ring-[var(--color-surface)]`}
        title={meta.label}
      />
      <div className="flex items-center gap-3 pr-4">
        {src ? (
          <img
            src={src}
            alt=""
            className="h-12 w-12 rounded-full object-cover ring-2 ring-[var(--color-border)]"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-sm font-semibold text-[var(--color-accent)]">
            {name
              .split(/\s+/)
              .map((p) => p[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate font-semibold transition group-hover:text-[var(--color-accent)]">
            {name}
          </p>
          <p className="truncate text-sm text-[var(--color-muted)]">{position ?? "—"}</p>
        </div>
      </div>
    </button>
  );
}
