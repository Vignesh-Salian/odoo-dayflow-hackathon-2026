/**
 * OWNER: Nidhish (Person B)
 */
import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { employeesApi } from "../../api/employees.ts";
import { payrollApi } from "../../api/payroll.ts";
import { getApiError } from "../../api/client.ts";
import { LoadingState } from "../../components/LoadingState.tsx";
import { EmptyState } from "../../components/EmptyState.tsx";
import { TabsPanel } from "../../components/TabsPanel.tsx";
import { SalaryStructurePanel, type SalaryStructure } from "../payroll/SalaryStructurePanel.tsx";
import { SetSalaryForm } from "../payroll/SetSalaryForm.tsx";
import { useAuth } from "../auth/AuthContext.tsx";
import {
  ProfileHeader,
  PrivateInfoTab,
  ResumeTab,
  type ProfileEmp,
} from "./EmployeeProfileShared.tsx";
import { AssignManagerPanel } from "./AssignManagerPanel.tsx";

export function EmployeeProfilePage() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const isHrOrAdmin = user?.role === "ADMIN" || user?.role === "HR";
  const canSeeSalary = isAdmin;
  const [tab, setTab] = useState("resume");
  const profileKey = ["employee", id] as const;

  const profile = useQuery({
    queryKey: profileKey,
    queryFn: async () => (await employeesApi.get(id)).data.data as ProfileEmp,
    enabled: !!id,
  });
  const salary = useQuery({
    queryKey: ["salary", id],
    queryFn: async () => {
      try {
        const res = await payrollApi.getSalaryStructure(id);
        return res.data.data as SalaryStructure;
      } catch (err) {
        if (getApiError(err).code === "NOT_FOUND") return null;
        throw err;
      }
    },
    enabled: !!id && canSeeSalary,
    retry: false,
  });

  if (profile.isLoading) return <LoadingState label="Loading profile…" />;
  if (profile.error) {
    return (
      <p className="df-card p-4 text-sm text-[var(--color-danger)]">
        {getApiError(profile.error).message}
      </p>
    );
  }
  if (!profile.data) {
    return <EmptyState title="Employee not found" />;
  }

  const emp = profile.data;
  const hasSalary = !!salary.data;
  const qk = [...profileKey];

  const salaryContent = (
    <div className="df-card space-y-4 p-5">
      {salary.isLoading ? <LoadingState label="Loading salary…" /> : null}
      {salary.isError ? (
        <p className="text-sm text-[var(--color-danger)]">{getApiError(salary.error).message}</p>
      ) : null}
      {!salary.isLoading && !hasSalary && isAdmin ? <SetSalaryForm employeeId={id} /> : null}
      {!salary.isLoading && !hasSalary && !isAdmin ? (
        <EmptyState
          title="No salary structure"
          description="Ask an Admin to set this employee’s monthly wage."
        />
      ) : null}
      {hasSalary ? (
        <>
          <SalaryStructurePanel data={salary.data} readOnly />
          {isAdmin ? (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm text-[var(--color-accent)]">
                Replace salary structure
              </summary>
              <SetSalaryForm employeeId={id} mode="replace" />
            </details>
          ) : null}
        </>
      ) : null}
    </div>
  );

  const tabs = [
    {
      id: "resume",
      label: "Resume",
      content: <ResumeTab emp={emp} canEdit={isHrOrAdmin} queryKey={qk} />,
    },
    {
      id: "private",
      label: "Private Info",
      content: <PrivateInfoTab emp={emp} canEdit={isHrOrAdmin} queryKey={qk} />,
    },
    ...(canSeeSalary ? [{ id: "salary", label: "Salary Info", content: salaryContent }] : []),
  ];

  const activeId = tabs.some((t) => t.id === tab) ? tab : tabs[0]!.id;

  return (
    <section className="space-y-6">
      <ProfileHeader
        emp={emp}
        companyName={user?.company?.name}
        canEditAvatar={isHrOrAdmin}
        queryKey={qk}
        trailing={
          <Link
            to="/employees"
            className="df-btn inline-flex items-center gap-1.5 border border-[var(--color-border)] bg-[var(--color-surface)] text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Directory
          </Link>
        }
      />
      {isHrOrAdmin ? (
        <AssignManagerPanel
          employeeId={emp.id}
          currentManagerId={emp.managerId ?? emp.manager?.id ?? null}
          queryKey={qk}
        />
      ) : null}
      <TabsPanel tabs={tabs} activeId={activeId} onChange={setTab} />
    </section>
  );
}
