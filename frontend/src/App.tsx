import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./features/auth/AuthContext.tsx";
import { LoginPage } from "./features/auth/LoginPage.tsx";
import { SignupPage } from "./features/auth/SignupPage.tsx";
import { ChangePasswordPage } from "./features/auth/ChangePasswordPage.tsx";
import { AppLayout } from "./components/AppLayout.tsx";
import { GuestOnly, RequireAuth } from "./routes/guards.tsx";
import { EmployeesPage } from "./features/employees/EmployeesPage.tsx";
import { EmployeeProfilePage } from "./features/employees/EmployeeProfilePage.tsx";
import { MyProfilePage } from "./features/employees/MyProfilePage.tsx";
import { PayrollPage } from "./features/payroll/PayrollPage.tsx";
import { AttendancePage } from "./features/attendance/AttendancePage.tsx";
import { AttendanceAllPage } from "./features/attendance/AttendanceAllPage.tsx";
import { AnalyticsPage } from "./features/analytics/AnalyticsPage.tsx";
import { TimeOffPage } from "./features/timeoff/TimeOffPage.tsx";
import { TimeOffManagePage } from "./features/timeoff/TimeOffManagePage.tsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
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
                <Route path="/" element={<Navigate to="/employees" replace />} />
                <Route path="/employees" element={<EmployeesPage />} />
                <Route path="/employees/:id" element={<EmployeeProfilePage />} />
                <Route path="/me" element={<MyProfilePage />} />
                <Route path="/attendance" element={<AttendancePage />} />
                <Route path="/attendance/all" element={<AttendanceAllPage />} />
                <Route path="/timeoff" element={<TimeOffPage />} />
                <Route path="/timeoff/manage" element={<TimeOffManagePage />} />
                <Route path="/payroll" element={<PayrollPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/employees" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
