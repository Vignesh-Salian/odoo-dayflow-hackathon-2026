/**
 * OWNER: Prajwal (Person D)
 * Year calendar for leave requests (WF8).
 */
export type CalendarEvent = {
  id: string;
  startDate: string;
  endDate: string;
  label: string;
  color?: string | null;
  status: string;
};

type CalendarProps = {
  year: number;
  events: CalendarEvent[];
  holidays?: { date: string; name: string }[];
  onDayClick?: (date: string) => void;
};

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function daysInMonth(year: number, monthIndex: number) {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

function eventOnDay(events: CalendarEvent[], dateKey: string) {
  return events.filter((e) => dateKey >= e.startDate && dateKey <= e.endDate);
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function Calendar({ year, events, holidays = [], onDayClick }: CalendarProps) {
  const holidayMap = new Map(holidays.map((h) => [h.date, h.name]));

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {MONTHS.map((name, monthIndex) => {
        const count = daysInMonth(year, monthIndex);
        const firstDow = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
        const cells: (number | null)[] = [
          ...Array.from({ length: firstDow }, () => null),
          ...Array.from({ length: count }, (_, i) => i + 1),
        ];

        return (
          <div
            key={name}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
          >
            <p className="mb-2 text-center text-sm font-semibold text-[var(--color-tab)]">{name}</p>
            <div className="mb-1 grid grid-cols-7 gap-0.5 text-center text-[10px] text-[var(--color-muted)]">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <span key={`${d}-${i}`}>{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {cells.map((day, idx) => {
                if (day == null) {
                  return <span key={`e-${idx}`} className="aspect-square" />;
                }
                const dateKey = `${year}-${pad(monthIndex + 1)}-${pad(day)}`;
                const hits = eventOnDay(events, dateKey);
                const holiday = holidayMap.get(dateKey);
                const dow = new Date(Date.UTC(year, monthIndex, day)).getUTCDay();
                const isWeekend = dow === 0 || dow === 6;
                const color = hits[0]?.color ?? (holiday ? "#3b82f6" : undefined);
                const title = [
                  holiday ? `Holiday: ${holiday}` : null,
                  ...hits.map((h) => `${h.label} (${h.status})`),
                ]
                  .filter(Boolean)
                  .join(" · ");

                return (
                  <button
                    key={dateKey}
                    type="button"
                    title={title || dateKey}
                    onClick={() => onDayClick?.(dateKey)}
                    className={`aspect-square rounded text-[11px] transition ${
                      hits.length
                        ? "font-semibold text-white"
                        : holiday
                          ? "bg-[var(--color-tab)]/25 text-[var(--color-tab)]"
                          : isWeekend
                            ? "text-[var(--color-muted)]/50"
                            : "text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]"
                    }`}
                    style={hits.length && color ? { backgroundColor: color } : undefined}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
