import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./features/auth/AuthContext.tsx";
import { ThemeProvider } from "./features/theme/ThemeContext.tsx";
import { LoginPage } from "./features/auth/LoginPage.tsx";
import { SignupPage } from "./features/auth/SignupPage.tsx";
import { ChangePasswordPage } from "./features/auth/ChangePasswordPage.tsx";
import { AppLayout } from "./components/AppLayout.tsx";
import { GuestOnly, HomeRedirect, RequireAuth } from "./routes/guards.tsx";
import { EmployeesPage } from "./features/employees/EmployeesPage.tsx";
import { EmployeeProfilePage } from "./features/employees/EmployeeProfilePage.tsx";
import { MyProfilePage } from "./features/employees/MyProfilePage.tsx";
import { PayrollPage } from "./features/payroll/PayrollPage.tsx";
import { AttendancePage } from "./features/attendance/AttendancePage.tsx";
import { AttendanceAllPage } from "./features/attendance/AttendanceAllPage.tsx";
import { AnalyticsPage } from "./features/analytics/AnalyticsPage.tsx";
import { TimeOffPage } from "./features/timeoff/TimeOffPage.tsx";
import { TimeOffManagePage } from "./features/timeoff/TimeOffManagePage.tsx";
import { CompanySettingsPage } from "./features/auth/CompanySettingsPage.tsx";
import { CompanySalaryPolicyPage } from "./features/payroll/CompanySalaryPolicyPage.tsx";
import { AuditLogsPage } from "./features/audit/AuditLogsPage.tsx";


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
            <Route element={<GuestOnly />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
            </Route>

            <Route element={<RequireAuth />}>
              <Route path="/change-password" element={<ChangePasswordPage />} />
              <Route element={<AppLayout />}>
                <Route path="/" element={<HomeRedirect />} />
                <Route path="/employees" element={<EmployeesPage />} />
                <Route path="/employees/:id" element={<EmployeeProfilePage />} />
                <Route path="/me" element={<MyProfilePage />} />
                <Route path="/attendance" element={<AttendancePage />} />
                <Route path="/attendance/all" element={<AttendanceAllPage />} />
                <Route path="/timeoff" element={<TimeOffPage />} />
                <Route path="/timeoff/manage" element={<TimeOffManagePage />} />
                <Route path="/payroll" element={<PayrollPage />} />
                <Route path="/salary-policy" element={<CompanySalaryPolicyPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/settings" element={<CompanySettingsPage />} />
                <Route path="/audit" element={<AuditLogsPage />} />
              </Route>
            </Route>

              <Route path="*" element={<HomeRedirect />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
