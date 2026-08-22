/**
 * OWNER: Nidhish (Person B) — Check In / Out + live Entry timer (PDF directory).
 */
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LogIn, LogOut, Timer } from "lucide-react";
import { attendanceApi } from "../../api/attendance.ts";
import { getApiError } from "../../api/client.ts";
import { todayKey as appTodayKey, todayMonthYear } from "../../utils/today.ts";

function formatElapsed(ms: number) {
  const totalMin = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}hr`;
}

export function CheckInWidget() {
  const qc = useQueryClient();
  const { month, year } = todayMonthYear();
  const [tick, setTick] = useState(() => Date.now());
  const [banner, setBanner] = useState<string | null>(null);

  const monthQ = useQuery({
    queryKey: ["attendance", "me", month, year],
    queryFn: async () => (await attendanceApi.me(month, year)).data.data,
    refetchInterval: 60_000,
  });

  const todayKey = appTodayKey();
  const todayRecord = useMemo(
    () => monthQ.data?.records.find((r) => r.date === todayKey) ?? null,
    [monthQ.data, todayKey],
  );

  const checkedIn = !!todayRecord?.checkIn && !todayRecord?.checkOut;
  const checkedOut = !!todayRecord?.checkIn && !!todayRecord?.checkOut;

  useEffect(() => {
    if (!checkedIn) return;
    const id = window.setInterval(() => setTick(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, [checkedIn]);

  const elapsedLabel = (() => {
    if (!todayRecord?.checkIn) return "Entry 00:00hr";
    const start = new Date(todayRecord.checkIn).getTime();
    const end = todayRecord.checkOut ? new Date(todayRecord.checkOut).getTime() : tick;
    return `Entry ${formatElapsed(end - start)}`;
  })();

  const checkInMut = useMutation({
    mutationFn: () => attendanceApi.checkIn(),
    onSuccess: () => {
      setBanner(null);
      void qc.invalidateQueries({ queryKey: ["attendance"] });
      void qc.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (err) => setBanner(getApiError(err).message),
  });

  const checkOutMut = useMutation({
    mutationFn: () => attendanceApi.checkOut(),
    onSuccess: () => {
      setBanner(null);
      void qc.invalidateQueries({ queryKey: ["attendance"] });
      void qc.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (err) => setBanner(getApiError(err).message),
  });

  return (
    <div className="df-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
            <Timer className="h-4.5 w-4.5" strokeWidth={1.75} />
          </span>
          <p className="text-sm font-semibold">Today&apos;s attendance</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => checkInMut.mutate()}
            disabled={checkInMut.isPending || !!todayRecord?.checkIn}
            className="df-btn df-btn-primary disabled:opacity-50"
          >
            <LogIn className="h-4 w-4" strokeWidth={1.75} />
            Check In
          </button>
          <span className="inline-flex items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 font-mono text-sm tabular-nums">
            {elapsedLabel}
          </span>
          <button
            type="button"
            onClick={() => checkOutMut.mutate()}
            disabled={checkOutMut.isPending || !checkedIn || checkedOut}
            className="df-btn border border-[var(--color-border)] bg-[var(--color-surface)] disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.75} />
            Check Out
          </button>
        </div>
      </div>
      {banner ? <p className="mt-3 text-sm text-[var(--color-danger)]">{banner}</p> : null}
    </div>
  );
}
