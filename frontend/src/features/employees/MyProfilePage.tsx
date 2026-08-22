/**
 * OWNER: Nidhish (Person B)
 */
import { useQuery } from "@tanstack/react-query";
import { employeesApi } from "../../api/employees.ts";
import { payrollApi } from "../../api/payroll.ts";

export function MyProfilePage() {
  const me = useQuery({
    queryKey: ["employees-me"],
    queryFn: async () => (await employeesApi.me()).data.data,
  });
  const emp = me.data as Record<string, unknown> | undefined;
  const empId = emp?.id ? String(emp.id) : "";
  const salary = useQuery({
    queryKey: ["salary-me", empId],
    queryFn: async () => (await payrollApi.getSalaryStructure(empId)).data.data,
    enabled: !!empId,
  });

  return (
    <section className="space-y-6">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">My Profile</h1>
      {me.isLoading ? <p className="text-[var(--color-muted)]">Loading…</p> : null}
      {emp ? (
        <div className="space-y-4">
          <p className="text-lg font-medium">
            {String(emp.firstName)} {String(emp.lastName)}
          </p>
          <p className="text-sm text-[var(--color-muted)]">Phone: {String(emp.phone ?? "—")}</p>
          <p className="text-sm text-[var(--color-muted)]">Address: {String(emp.residingAddress ?? "—")}</p>
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <h2 className="mb-2 font-semibold">Salary (read-only)</h2>
            <pre className="overflow-auto text-xs text-[var(--color-muted)]">
              {JSON.stringify(salary.data ?? {}, null, 2)}
            </pre>
          </div>
        </div>
      ) : null}
    </section>
  );
}
