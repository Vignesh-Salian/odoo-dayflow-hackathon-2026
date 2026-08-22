/**
 * OWNER: Prajwal (Person D)
 * Tab switcher for manage / profile style screens.
 */
import type { ReactNode } from "react";

export type TabItem = {
  id: string;
  label: string;
  content: ReactNode;
};

type TabsPanelProps = {
  tabs: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
};

export function TabsPanel({ tabs, activeId, onChange }: TabsPanelProps) {
  const active = tabs.find((t) => t.id === activeId) ?? tabs[0];

  return (
    <div>
      <div
        className="inline-flex flex-wrap gap-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)]/70 p-1"
        role="tablist"
        aria-label="Sections"
      >
        {tabs.map((tab) => {
          const selected = tab.id === active?.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                selected
                  ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm"
                  : "text-[var(--color-muted)] hover:text-[var(--color-text)]"
              }`}
              onClick={() => onChange(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div className="pt-5" role="tabpanel">
        {active?.content}
      </div>
    </div>
  );
}
