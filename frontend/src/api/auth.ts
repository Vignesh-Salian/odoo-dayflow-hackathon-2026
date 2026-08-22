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

export type CompanySignupPayload = {
  companyName: string;
  country?: string;
  adminFirstName: string;
  adminLastName: string;
  email: string;
  password: string;
  phone?: string;
  logo?: File | null;
};

export const authApi = {
  companySignup(payload: CompanySignupPayload) {
    const form = new FormData();
    form.append("companyName", payload.companyName);
    if (payload.country) form.append("country", payload.country);
    form.append("adminFirstName", payload.adminFirstName);
    form.append("adminLastName", payload.adminLastName);
    form.append("email", payload.email);
    form.append("password", payload.password);
    if (payload.phone) form.append("phone", payload.phone);
    if (payload.logo) form.append("logo", payload.logo);
    return api.post<{ success: true; data: AuthResponse }>("/auth/company-signup", form, {
      headers: { "Content-Type": undefined },
    });
  },

  updateCompanyLogo(logo: File) {
    const form = new FormData();
    form.append("logo", logo);
    return api.post<{ success: true; data: AuthUser }>("/auth/company/logo", form, {
      headers: { "Content-Type": undefined },
    });
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
