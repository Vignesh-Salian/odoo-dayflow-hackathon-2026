import { api } from "./client.ts";

export type AuthUser = {
  id: string;
  email: string;
  loginId: string;
  role: "ADMIN" | "HR" | "EMPLOYEE";
  mustChangePassword: boolean;
  emailVerified: boolean;
  companyId: string;
  employeeId: string | null;
  firstName: string | null;
  lastName: string | null;
  company?: {
    id: string;
    name: string;
    code: string;
    logoUrl: string | null;
  };
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  mustChangePassword: boolean;
  user: AuthUser;
};

export const authApi = {
  companySignup(payload: {
    companyName: string;
    country?: string;
    adminFirstName: string;
    adminLastName: string;
    email: string;
    password: string;
  }) {
    return api.post<{ success: true; data: AuthResponse }>("/auth/company-signup", payload);
  },

  login(identifier: string, password: string) {
    return api.post<{ success: true; data: AuthResponse }>("/auth/login", {
      identifier,
      password,
    });
  },

  refresh(refreshToken: string) {
    return api.post<{ success: true; data: AuthResponse }>("/auth/refresh", { refreshToken });
  },

  changePassword(currentPassword: string, newPassword: string) {
    return api.post<{ success: true; data: AuthResponse }>("/auth/change-password", {
      currentPassword,
      newPassword,
    });
  },

  me() {
    return api.get<{ success: true; data: AuthUser }>("/auth/me");
  },

  verifyEmail(token: string) {
    return api.post("/auth/verify-email", { token });
  },
};
