import { request } from "./client";

export const districtsApi = {
  list: () => request("/admin/districts"),
  create: (data) => request("/admin/districts", { method: "POST", body: data }),
  update: (id, data) => request(`/admin/districts/${id}`, { method: "PUT", body: data }),
  remove: (id) => request(`/admin/districts/${id}`, { method: "DELETE" }),
  listNeighborhoods: (districtId) =>
    request(`/admin/districts/${districtId}/neighborhoods`),
  createNeighborhood: (districtId, data) =>
    request(`/admin/districts/${districtId}/neighborhoods`, { method: "POST", body: data }),
  updateNeighborhood: (id, data) =>
    request(`/admin/districts/neighborhoods/${id}`, { method: "PUT", body: data }),
  removeNeighborhood: (id) =>
    request(`/admin/districts/neighborhoods/${id}`, { method: "DELETE" }),
};
