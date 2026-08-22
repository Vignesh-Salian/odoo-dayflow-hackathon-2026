/**
 * OWNER: Nidhish (Person B) — hierarchical org chart from managerId.
 */
import { useMemo, type CSSProperties } from "react";
import { Network } from "lucide-react";
import { mediaUrl } from "../../utils/format.ts";

export type OrgPerson = {
  id: string;
  firstName: string;
  lastName: string;
  jobPosition?: string | null;
  avatarUrl?: string | null;
  managerId?: string | null;
};

type TreeNode = OrgPerson & { children: TreeNode[] };

function buildForest(people: OrgPerson[]): TreeNode[] {
  const byId = new Map<string, TreeNode>();
  for (const p of people) {
    byId.set(p.id, { ...p, children: [] });
  }
  const roots: TreeNode[] = [];
  for (const node of byId.values()) {
    const mid = node.managerId;
    if (mid && byId.has(mid) && mid !== node.id) {
      byId.get(mid)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  const sortRec = (n: TreeNode) => {
    n.children.sort((a, b) =>
      `${a.firstName}${a.lastName}`.localeCompare(`${b.firstName}${b.lastName}`),
    );
    n.children.forEach(sortRec);
  };
  roots.forEach(sortRec);
  roots.sort((a, b) =>
    `${a.firstName}${a.lastName}`.localeCompare(`${b.firstName}${b.lastName}`),
  );
  return roots;
}

function PersonCard({
  node,
  onSelect,
}: {
  node: TreeNode;
  onSelect?: (id: string) => void;
}) {
  const src = mediaUrl(node.avatarUrl);
  const initials = `${node.firstName?.[0] ?? ""}${node.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <button
      type="button"
      onClick={() => onSelect?.(node.id)}
      className="df-card mx-auto flex w-[11.5rem] cursor-pointer flex-col items-center gap-2 px-3 py-3 text-center transition hover:-translate-y-0.5 hover:border-[var(--color-accent)]/40"
    >
      {src ? (
        <img src={src} alt="" className="h-12 w-12 rounded-xl object-cover" />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-accent-soft)] text-sm font-bold text-[var(--color-accent)]">
          {initials}
        </div>
      )}
      <div className="min-w-0 w-full">
        <p className="truncate text-sm font-semibold">
          {node.firstName} {node.lastName}
        </p>
        <p className="truncate text-[11px] text-[var(--color-muted)]">
          {node.jobPosition ?? "—"}
        </p>
      </div>
      {node.children.length > 0 ? (
        <span className="rounded-full bg-[var(--color-accent-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-accent)]">
          {node.children.length} report{node.children.length === 1 ? "" : "s"}
        </span>
      ) : null}
    </button>
  );
}

function OrgBranch({
  node,
  onSelect,
}: {
  node: TreeNode;
  onSelect?: (id: string) => void;
}) {
  const hasKids = node.children.length > 0;

  return (
    <div className="flex flex-col items-center">
      <PersonCard node={node} onSelect={onSelect} />

      {hasKids ? (
        <>
          {/* Vertical stem from parent */}
          <div className="h-5 w-px bg-[var(--color-border)]" aria-hidden />

          {/* Horizontal bar + children */}
          <div className="relative flex items-start justify-center gap-4 pt-0">
            {node.children.length > 1 ? (
              <div
                className="absolute left-[calc(50%/var(--kids,2))] right-[calc(50%/var(--kids,2))] top-0 h-px bg-[var(--color-border)]"
                style={
                  {
                    left: `calc(100% / ${node.children.length} / 2)`,
                    right: `calc(100% / ${node.children.length} / 2)`,
                  } as CSSProperties
                }
                aria-hidden
              />
            ) : null}

            {node.children.map((child) => (
              <div key={child.id} className="relative flex flex-col items-center">
                <div className="h-5 w-px bg-[var(--color-border)]" aria-hidden />
                <OrgBranch node={child} onSelect={onSelect} />
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

export function OrgChart({
  people,
  onSelect,
}: {
  people: OrgPerson[];
  onSelect?: (id: string) => void;
}) {
  const forest = useMemo(() => buildForest(people), [people]);

  if (people.length === 0) {
    return (
      <div className="df-card p-6 text-center text-sm text-[var(--color-muted)]">
        No employees to chart yet.
      </div>
    );
  }

  return (
    <div className="df-card overflow-x-auto p-5">
      <div className="mb-6 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
          <Network className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-base font-semibold">
            Org chart
          </h2>
          <p className="text-xs text-[var(--color-muted)]">
            Click a person to open their profile
          </p>
        </div>
      </div>

      <div className="flex min-w-max flex-wrap justify-center gap-10 px-2 pb-4">
        {forest.map((root) => (
          <OrgBranch key={root.id} node={root} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}
