/**
 * OWNER: Nidhish (Person B) — ADMIN/HR assign line manager from employee list.
 */
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserCog } from "lucide-react";
import { employeesApi } from "../../api/employees.ts";
import { getApiError } from "../../api/client.ts";
import { SelectField } from "../../components/FormField.tsx";

type Props = {
  employeeId: string;
  currentManagerId?: string | null;
  queryKey: unknown[];
};

export function AssignManagerPanel({ employeeId, currentManagerId, queryKey }: Props) {
  const qc = useQueryClient();
  const [managerId, setManagerId] = useState(currentManagerId ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const listQ = useQuery({
    queryKey: ["employees", "manager-picker"],
    queryFn: async () => {
      const res = await employeesApi.list({ page: 1, limit: 100 });
      return res.data.data as {
        items: Array<{ id: string; firstName: string; lastName: string; jobPosition?: string | null }>;
      };
    },
  });

  const options = useMemo(
    () => (listQ.data?.items ?? []).filter((e) => e.id !== employeeId),
    [listQ.data, employeeId],
  );

  const saveMut = useMutation({
    mutationFn: () =>
      employeesApi.update(employeeId, {
        managerId: managerId || null,
      }),
    onSuccess: async () => {
      setMsg("Manager updated.");
      setError(null);
      await qc.invalidateQueries({ queryKey });
      await qc.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (err) => {
      setMsg(null);
      setError(getApiError(err).message);
    },
  });

  return (
    <div className="df-card p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
          <UserCog className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <div>
          <h3 className="font-[family-name:var(--font-display)] text-base font-semibold">
            Assign manager
          </h3>
          <p className="text-xs text-[var(--color-muted)]">
            Choose a line manager from the company employee list.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[16rem] flex-1">
          <SelectField
            label="Manager"
            name="managerId"
            value={managerId}
            onChange={(e) => {
              setManagerId(e.target.value);
              setMsg(null);
            }}
          >
            <option value="">No manager</option>
            {options.map((e) => (
              <option key={e.id} value={e.id}>
                {e.firstName} {e.lastName}
                {e.jobPosition ? ` — ${e.jobPosition}` : ""}
              </option>
            ))}
          </SelectField>
        </div>
        <button
          type="button"
          disabled={saveMut.isPending || managerId === (currentManagerId ?? "")}
          onClick={() => saveMut.mutate()}
          className="df-btn df-btn-primary disabled:opacity-50"
        >
          {saveMut.isPending ? "Saving…" : "Save"}
        </button>
      </div>
      {error ? <p className="mt-2 text-sm text-[var(--color-danger)]">{error}</p> : null}
      {msg ? <p className="mt-2 text-sm text-[var(--color-success)]">{msg}</p> : null}
    </div>
  );
}
