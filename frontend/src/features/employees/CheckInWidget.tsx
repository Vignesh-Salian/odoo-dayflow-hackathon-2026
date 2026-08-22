/**
 * OWNER: Nidhish (Person B) — Check In / Out + live Entry timer (PDF directory).
 */
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { attendanceApi } from "../../api/attendance.ts";
import { getApiError } from "../../api/client.ts";

function formatElapsed(ms: number) {
  const totalMin = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}hr`;
}

export function CheckInWidget() {
  const qc = useQueryClient();
  const now = new Date();
  const [tick, setTick] = useState(() => Date.now());
  const [banner, setBanner] = useState<string | null>(null);

  const monthQ = useQuery({
    queryKey: ["attendance", "me", now.getMonth() + 1, now.getFullYear()],
    queryFn: async () =>
      (await attendanceApi.me(now.getMonth() + 1, now.getFullYear())).data.data,
    refetchInterval: 60_000,
  });

  const todayKey = new Date().toISOString().slice(0, 10);
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
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-[var(--color-muted)]">Today’s attendance</p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => checkInMut.mutate()}
            disabled={checkInMut.isPending || !!todayRecord?.checkIn}
            className="rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            Check In →
          </button>
          <span className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 font-mono text-sm tabular-nums">
            {elapsedLabel}
          </span>
          <button
            type="button"
            onClick={() => checkOutMut.mutate()}
            disabled={checkOutMut.isPending || !checkedIn || checkedOut}
            className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Check Out →
          </button>
        </div>
      </div>
      {banner ? <p className="mt-2 text-sm text-[var(--color-danger)]">{banner}</p> : null}
    </div>
  );
}
