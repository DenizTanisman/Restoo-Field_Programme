import { request, requestBlob, API_URL, getToken } from "./client";

function qs(params) {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "");
  if (!entries.length) return "";
  return "?" + new URLSearchParams(entries).toString();
}

export const restaurantsApi = {
  list: (params = {}) => request(`/admin/restaurants${qs(params)}`),
  create: (data) => request("/admin/restaurants", { method: "POST", body: data }),
  update: (id, data) => request(`/admin/restaurants/${id}`, { method: "PUT", body: data }),
  remove: (id) => request(`/admin/restaurants/${id}`, { method: "DELETE" }),
  exportCsv: () => requestBlob("/admin/restaurants/csv"),
  importCsv: async (file) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${API_URL}/admin/restaurants/csv`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
      body: fd,
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(t || `HTTP ${res.status}`);
    }
    return res.json();
  },
};
