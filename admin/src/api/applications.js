import { request, requestBlob } from "./client";

function qs(params) {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "");
  if (!entries.length) return "";
  return "?" + new URLSearchParams(entries).toString();
}

export const applicationsApi = {
  list: (params = {}) => request(`/admin/applications${qs(params)}`),
  create: (payload) =>
    request("/admin/applications", { method: "POST", body: payload }),
  update: (id, payload) =>
    request(`/admin/applications/${id}`, { method: "PATCH", body: payload }),
  remove: (id) =>
    request(`/admin/applications/${id}`, { method: "DELETE" }),
  updateStatus: (id, status) =>
    request(`/admin/applications/${id}/status`, { method: "PATCH", body: { status } }),
  exportCsv: () => requestBlob("/admin/applications/csv"),
};
