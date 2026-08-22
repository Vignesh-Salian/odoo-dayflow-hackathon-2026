/**
 * OWNER: Nidhish (Person B)
 */
import { Link, useParams } from "react-router-dom";
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
  manager?: { firstName: string; lastName: string } | null;
  user?: { loginId: string; email: string; role: string };
  skills?: { id: string; name: string }[];
  certifications?: { id: string; name: string; issuedBy?: string | null; year?: number | null }[];
  documents?: { id: string; docType: string; fileUrl: string }[];
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    panNo: string;
  } | null;
  resume?: { about?: string | null } | null;
};

export function EmployeeProfilePage() {
  const { id = "" } = useParams();
  const profile = useQuery({
    queryKey: ["employee", id],
    queryFn: async () => (await employeesApi.get(id)).data.data as Emp,
    enabled: !!id,
  });
  const salary = useQuery({
    queryKey: ["salary", id],
    queryFn: async () =>
      (await payrollApi.getSalaryStructure(id)).data.data as SalaryStructure,
    enabled: !!id,
  });

  if (profile.isLoading) return <LoadingState label="Loading profile…" />;
  if (profile.error) {
    return <p className="text-[var(--color-danger)]">{getApiError(profile.error).message}</p>;
  }
  if (!profile.data) {
    return <EmptyState title="Employee not found" />;
  }

  const emp = profile.data;
  const avatar = mediaUrl(emp.avatarUrl);

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
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
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
              {emp.firstName} {emp.lastName}
            </h1>
            <p className="text-sm text-[var(--color-muted)]">
              {emp.jobPosition ?? "—"}
              {emp.department ? ` · ${emp.department.name}` : ""}
            </p>
            <p className="text-xs text-[var(--color-muted)]">
              {emp.user?.loginId} · {emp.user?.email}
            </p>
          </div>
        </div>
        <Link to="/employees" className="text-sm text-[var(--color-accent)] hover:underline">
          ← Directory
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h2 className="font-semibold text-[var(--color-tab)]">Job & contact</h2>
          <dl className="grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
            <dt className="text-[var(--color-muted)]">Phone</dt>
            <dd>{emp.phone ?? "—"}</dd>
            <dt className="text-[var(--color-muted)]">Location</dt>
            <dd>{emp.workLocation ?? "—"}</dd>
            <dt className="text-[var(--color-muted)]">Address</dt>
            <dd>{emp.residingAddress ?? "—"}</dd>
            <dt className="text-[var(--color-muted)]">Personal email</dt>
            <dd>{emp.personalEmail ?? "—"}</dd>
            <dt className="text-[var(--color-muted)]">Joined</dt>
            <dd>
              {emp.dateOfJoining ? new Date(emp.dateOfJoining).toLocaleDateString() : "—"}
            </dd>
            <dt className="text-[var(--color-muted)]">Manager</dt>
            <dd>
              {emp.manager ? `${emp.manager.firstName} ${emp.manager.lastName}` : "—"}
            </dd>
          </dl>
          {emp.resume?.about ? (
            <p className="border-t border-[var(--color-border)] pt-3 text-sm text-[var(--color-muted)]">
              {emp.resume.about}
            </p>
          ) : null}
        </div>

        <div className="space-y-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h2 className="font-semibold text-[var(--color-tab)]">Skills & docs</h2>
          <div className="flex flex-wrap gap-2">
            {(emp.skills ?? []).length === 0 ? (
              <span className="text-sm text-[var(--color-muted)]">No skills listed</span>
            ) : (
              emp.skills!.map((s) => (
                <span
                  key={s.id}
                  className="rounded-md border border-[var(--color-border)] px-2 py-0.5 text-xs"
                >
                  {s.name}
                </span>
              ))
            )}
          </div>
          <ul className="space-y-1 text-sm text-[var(--color-muted)]">
            {(emp.certifications ?? []).map((c) => (
              <li key={c.id}>
                {c.name}
                {c.issuedBy ? ` — ${c.issuedBy}` : ""}
                {c.year ? ` (${c.year})` : ""}
              </li>
            ))}
          </ul>
          {(emp.documents ?? []).length > 0 ? (
            <ul className="space-y-1 text-sm">
              {emp.documents!.map((d) => (
                <li key={d.id}>
                  <a
                    className="text-[var(--color-accent)] hover:underline"
                    href={mediaUrl(d.fileUrl) ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {d.docType}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
          {emp.bankDetails ? (
            <div className="border-t border-[var(--color-border)] pt-3 text-sm">
              <p className="font-medium">Bank</p>
              <p className="text-[var(--color-muted)]">
                {emp.bankDetails.bankName} · ****{emp.bankDetails.accountNumber.slice(-4)} ·{" "}
                {emp.bankDetails.ifscCode}
              </p>
              <p className="text-[var(--color-muted)]">PAN {emp.bankDetails.panNo}</p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h2 className="mb-4 font-semibold text-[var(--color-tab)]">Salary structure</h2>
        <SalaryStructurePanel
          data={salary.isError ? null : salary.data}
          isLoading={salary.isLoading}
          readOnly
        />
      </div>
    </section>
  );
}
