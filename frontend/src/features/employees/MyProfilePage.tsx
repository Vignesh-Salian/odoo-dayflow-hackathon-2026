/**
 * OWNER: Nidhish (Person B)
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { employeesApi } from "../../api/employees.ts";
import { payrollApi } from "../../api/payroll.ts";
import { getApiError } from "../../api/client.ts";
import { LoadingState } from "../../components/LoadingState.tsx";
import { EmptyState } from "../../components/EmptyState.tsx";
import { TabsPanel } from "../../components/TabsPanel.tsx";
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

  const me = useQuery({
    queryKey: ["employees-me"],
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

  const tabs = [
    { id: "resume", label: "Resume", content: <ResumeTab emp={emp} /> },
    { id: "private", label: "Private Info", content: <PrivateInfoTab emp={emp} /> },
    {
      id: "salary",
      label: "Salary Info",
      content: (
        <SalaryStructurePanel
          data={salary.isError ? null : salary.data}
          isLoading={salary.isLoading}
          readOnly
        />
      ),
    },
    { id: "security", label: "Security", content: <SecurityPasswordForm /> },
  ];

  return (
    <section className="space-y-8">
      <ProfileHeader emp={emp} companyName={user?.company?.name} title="My Profile" />
      <TabsPanel tabs={tabs} activeId={tab} onChange={setTab} />
    </section>
  );
}
