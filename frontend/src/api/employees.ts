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
};
