import { request } from "./client";

export const categoriesApi = {
  list: () => request("/admin/categories"),
  create: (data) => request("/admin/categories", { method: "POST", body: data }),
  update: (id, data) => request(`/admin/categories/${id}`, { method: "PUT", body: data }),
  remove: (id) => request(`/admin/categories/${id}`, { method: "DELETE" }),
};
