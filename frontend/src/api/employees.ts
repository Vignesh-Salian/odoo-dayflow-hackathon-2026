/**
 * OWNER: Nidhish (Person B)
 */
import { api } from "./client.ts";

export const employeesApi = {
  list(params?: { search?: string; page?: number; limit?: number }) {
    return api.get("/employees", { params });
  },
  get(id: string) {
    return api.get(`/employees/${id}`);
  },
  me() {
    return api.get("/employees/me");
  },
  create(body: Record<string, unknown>) {
    return api.post("/employees", body);
  },
  update(id: string, body: Record<string, unknown>) {
    return api.patch(`/employees/${id}`, body);
  },
  updateMe(body: Record<string, unknown>) {
    return api.patch("/employees/me", body);
  },
  putResume(
    id: string,
    body: { about?: string | null; loveAboutJob?: string | null; interestsHobbies?: string | null },
  ) {
    return api.put(`/employees/${id}/resume`, body);
  },
  putBank(
    id: string,
    body: {
      accountHolderName?: string | null;
      accountNumber: string;
      bankName: string;
      branchName?: string | null;
      ifscCode: string;
      panNo: string;
      uanNo: string;
      empCode: string;
    },
  ) {
    return api.put(`/employees/${id}/bank`, body);
  },
  addCertification(
    id: string,
    data: { name: string; issuedBy?: string; year?: number; file?: File | null },
  ) {
    const form = new FormData();
    form.append("name", data.name);
    if (data.issuedBy) form.append("issuedBy", data.issuedBy);
    if (data.year != null) form.append("year", String(data.year));
    if (data.file) form.append("file", data.file);
    return api.post(`/employees/${id}/certifications`, form);
  },
  addSkill(id: string, name: string) {
    return api.post(`/employees/${id}/skills`, { name });
  },
  uploadAvatar(id: string, file: File) {
    const form = new FormData();
    form.append("avatar", file);
    return api.post(`/employees/${id}/avatar`, form);
  },
};
