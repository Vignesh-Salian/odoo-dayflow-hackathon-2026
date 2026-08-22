/**
 * OWNER: Nidhish (Person B)
 */
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { employeesApi } from "../../api/employees.ts";
import { payrollApi } from "../../api/payroll.ts";

export function EmployeeProfilePage() {
  const { id = "" } = useParams();
  const profile = useQuery({
    queryKey: ["employee", id],
    queryFn: async () => (await employeesApi.get(id)).data.data,
    enabled: !!id,
  });
  const salary = useQuery({
    queryKey: ["salary", id],
    queryFn: async () => (await payrollApi.getSalaryStructure(id)).data.data,
    enabled: !!id,
  });

  const emp = profile.data as Record<string, unknown> | undefined;

  return (
    <section className="space-y-6">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
        {emp ? `${emp.firstName} ${emp.lastName}` : "Employee profile"}
      </h1>
      {profile.isLoading ? <p className="text-[var(--color-muted)]">Loading…</p> : null}
      {emp ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <h2 className="font-semibold text-[var(--color-tab)]">Profile</h2>
            <p className="text-sm text-[var(--color-muted)]">Position: {String(emp.jobPosition ?? "—")}</p>
            <p className="text-sm text-[var(--color-muted)]">Phone: {String(emp.phone ?? "—")}</p>
            <p className="text-sm text-[var(--color-muted)]">Location: {String(emp.workLocation ?? "—")}</p>
          </div>
          <div className="space-y-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <h2 className="font-semibold text-[var(--color-tab)]">Salary</h2>
            {salary.isLoading ? (
              <p className="text-sm text-[var(--color-muted)]">Loading salary…</p>
            ) : (
              <pre className="overflow-auto text-xs text-[var(--color-muted)]">
                {JSON.stringify(salary.data ?? { note: "No structure" }, null, 2)}
              </pre>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
