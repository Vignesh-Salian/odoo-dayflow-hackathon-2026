/**
 * OWNER: Nidhish (Person B)
 */
import { useQuery } from "@tanstack/react-query";
import { employeesApi } from "../../api/employees.ts";
import { payrollApi } from "../../api/payroll.ts";
import { getApiError } from "../../api/client.ts";
import { mediaUrl } from "../../utils/format.ts";
import { LoadingState } from "../../components/LoadingState.tsx";
import { EmptyState } from "../../components/EmptyState.tsx";
import { SalaryStructurePanel, type SalaryStructure } from "../payroll/SalaryStructurePanel.tsx";

type Emp = {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  jobPosition?: string | null;
  workLocation?: string | null;
  residingAddress?: string | null;
  personalEmail?: string | null;
  dateOfJoining?: string | null;
  department?: { name: string } | null;
  user?: { loginId: string; email: string };
  skills?: { id: string; name: string }[];
  bankDetails?: { bankName: string; accountNumber: string; ifscCode: string } | null;
};

export function MyProfilePage() {
  const me = useQuery({
    queryKey: ["employees-me"],
    queryFn: async () => (await employeesApi.me()).data.data as Emp,
  });
  const empId = me.data?.id ?? "";
  const salary = useQuery({
    queryKey: ["salary-me", empId],
    queryFn: async () =>
      (await payrollApi.getSalaryStructure(empId)).data.data as SalaryStructure,
    enabled: !!empId,
  });

  if (me.isLoading) return <LoadingState label="Loading your profile…" />;
  if (me.error) {
    return <p className="text-[var(--color-danger)]">{getApiError(me.error).message}</p>;
  }
  if (!me.data) {
    return (
      <EmptyState
        title="No employee profile"
        description="Ask HR to link an employee record to your login."
      />
    );
  }

  const emp = me.data;
  const avatar = mediaUrl(emp.avatarUrl);

  return (
    <section className="space-y-8">
      <div className="flex items-center gap-4">
        {avatar ? (
          <img
            src={avatar}
            alt=""
            className="h-16 w-16 rounded-full object-cover ring-2 ring-[var(--color-border)]"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-surface)] text-xl font-semibold text-[var(--color-muted)]">
            {emp.firstName?.[0]}
            {emp.lastName?.[0]}
          </div>
        )}
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">My Profile</h1>
          <p className="text-sm text-[var(--color-muted)]">
            {emp.firstName} {emp.lastName}
            {emp.jobPosition ? ` · ${emp.jobPosition}` : ""}
          </p>
          <p className="text-xs text-[var(--color-muted)]">
            {emp.user?.loginId} · {emp.user?.email}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h2 className="mb-3 font-semibold text-[var(--color-tab)]">Contact</h2>
        <dl className="grid max-w-xl grid-cols-[8rem_1fr] gap-y-2 text-sm">
          <dt className="text-[var(--color-muted)]">Phone</dt>
          <dd>{emp.phone ?? "—"}</dd>
          <dt className="text-[var(--color-muted)]">Address</dt>
          <dd>{emp.residingAddress ?? "—"}</dd>
          <dt className="text-[var(--color-muted)]">Location</dt>
          <dd>{emp.workLocation ?? "—"}</dd>
          <dt className="text-[var(--color-muted)]">Department</dt>
          <dd>{emp.department?.name ?? "—"}</dd>
        </dl>
        {(emp.skills ?? []).length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {emp.skills!.map((s) => (
              <span
                key={s.id}
                className="rounded-md border border-[var(--color-border)] px-2 py-0.5 text-xs"
              >
                {s.name}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h2 className="mb-4 font-semibold text-[var(--color-tab)]">Salary (read-only)</h2>
        <SalaryStructurePanel
          data={salary.isError ? null : salary.data}
          isLoading={salary.isLoading}
          readOnly
        />
      </div>
    </section>
  );
}
