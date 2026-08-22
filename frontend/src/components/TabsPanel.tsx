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
        className="flex flex-wrap gap-1 border-b border-[var(--color-border)]"
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
              className={`relative px-4 py-2.5 text-sm font-medium transition ${
                selected
                  ? "text-[var(--color-tab)]"
                  : "text-[var(--color-muted)] hover:text-[var(--color-text)]"
              }`}
              onClick={() => onChange(tab.id)}
            >
              {tab.label}
              {selected ? (
                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[var(--color-tab)]" />
              ) : null}
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
