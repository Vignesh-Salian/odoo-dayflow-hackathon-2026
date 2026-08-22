/**
 * OWNER: Nidhish (Person B)
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { employeesApi } from "../../api/employees.ts";
import { payrollApi } from "../../api/payroll.ts";
import { getApiError } from "../../api/client.ts";
import { EmptyState } from "../../components/EmptyState.tsx";
import { TabsPanel } from "../../components/TabsPanel.tsx";
import { Skeleton, SkeletonPanel } from "../../components/Skeleton.tsx";
import { SalaryStructurePanel, type SalaryStructure } from "../payroll/SalaryStructurePanel.tsx";
import { useAuth } from "../auth/AuthContext.tsx";
import {
  ProfileHeader,
  PrivateInfoTab,
  ResumeTab,
  type ProfileEmp,
} from "./EmployeeProfileShared.tsx";
import { SecurityPasswordForm } from "./SecurityPasswordForm.tsx";

export function MyProfilePage() {
  const { user } = useAuth();
  const [tab, setTab] = useState("private");
  const profileKey = ["employees-me"] as const;

  const me = useQuery({
    queryKey: profileKey,
    queryFn: async () => (await employeesApi.me()).data.data as ProfileEmp,
  });
  const empId = me.data?.id ?? "";
  const salary = useQuery({
    queryKey: ["salary-me", empId],
    queryFn: async () => {
      try {
        const res = await payrollApi.getSalaryStructure(empId);
        return res.data.data as SalaryStructure;
      } catch (err) {
        if (getApiError(err).code === "NOT_FOUND") return null;
        throw err;
      }
    },
    enabled: !!empId,
    retry: false,
  });

  if (me.isLoading) {
    return (
      <section className="animate-fade-up space-y-6" role="status" aria-label="Loading profile">
        <div className="df-card flex gap-5 p-6">
          <Skeleton className="h-24 w-24 shrink-0 rounded-2xl" />
          <div className="flex-1 space-y-3 pt-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-40" />
            <div className="flex gap-2 pt-1">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          </div>
        </div>
        <SkeletonPanel className="h-72" />
      </section>
    );
  }

  if (me.error) {
    return (
      <p className="df-card p-4 text-sm text-[var(--color-danger)]">
        {getApiError(me.error).message}
      </p>
    );
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
  const qk = [...profileKey];

  const tabs = [
    {
      id: "resume",
      label: "Resume",
      content: <ResumeTab emp={emp} canEdit queryKey={qk} />,
    },
    {
      id: "private",
      label: "Private Info",
      content: <PrivateInfoTab emp={emp} canEdit queryKey={qk} />,
    },
    {
      id: "salary",
      label: "Salary Info",
      content: (
        <div className="df-card p-5">
          <SalaryStructurePanel
            data={salary.isError ? null : salary.data}
            isLoading={salary.isLoading}
            readOnly
          />
        </div>
      ),
    },
    {
      id: "security",
      label: "Security",
      content: (
        <div className="df-card max-w-lg p-5">
          <SecurityPasswordForm />
        </div>
      ),
    },
  ];

  return (
    <section className="space-y-6">
      <ProfileHeader emp={emp} companyName={user?.company?.name} title="My Profile" canEditAvatar queryKey={qk} />
      <TabsPanel tabs={tabs} activeId={tab} onChange={setTab} />
    </section>
  );
}
