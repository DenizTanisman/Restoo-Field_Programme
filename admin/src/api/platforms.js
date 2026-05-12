import { request } from "./client";

export const platformsApi = {
  list: () => request("/admin/platforms"),
  create: (data) => request("/admin/platforms", { method: "POST", body: data }),
  update: (id, data) => request(`/admin/platforms/${id}`, { method: "PUT", body: data }),
  remove: (id) => request(`/admin/platforms/${id}`, { method: "DELETE" }),
};
