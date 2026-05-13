import { request, requestBlob, API_URL, getToken } from "./client";

function qs(params) {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "");
  if (!entries.length) return "";
  return "?" + new URLSearchParams(entries).toString();
}

async function postCsv(path, file) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: fd,
  });
  if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`);
  return res.json();
}

export const analyticsApi = {
  district: {
    list: (params = {}) => request(`/admin/analytics/district${qs(params)}`),
    upsert: (data) => request("/admin/analytics/district", { method: "POST", body: data }),
    exportCsv: () => requestBlob("/admin/analytics/district/csv"),
    importCsv: (file) => postCsv("/admin/analytics/district/csv", file),
  },
  neighborhood: {
    list: (params = {}) => request(`/admin/analytics/neighborhood${qs(params)}`),
    upsert: (data) => request("/admin/analytics/neighborhood", { method: "POST", body: data }),
    exportCsv: () => requestBlob("/admin/analytics/neighborhood/csv"),
    importCsv: (file) => postCsv("/admin/analytics/neighborhood/csv", file),
  },
  competitors: {
    list: (params = {}) => request(`/admin/analytics/competitors${qs(params)}`),
    upsert: (data) => request("/admin/analytics/competitors", { method: "POST", body: data }),
    exportCsv: () => requestBlob("/admin/analytics/competitors/csv"),
    importCsv: (file) => postCsv("/admin/analytics/competitors/csv", file),
  },
};

export const metricsApi = {
  district: {
    list: (params = {}) => request(`/admin/metrics/district${qs(params)}`),
    upsert: (data) => request("/admin/metrics/district", { method: "POST", body: data }),
    exportCsv: () => requestBlob("/admin/metrics/district/csv"),
    importCsv: (file) => postCsv("/admin/metrics/district/csv", file),
  },
  neighborhood: {
    list: (params = {}) => request(`/admin/metrics/neighborhood${qs(params)}`),
    upsert: (data) => request("/admin/metrics/neighborhood", { method: "POST", body: data }),
    exportCsv: () => requestBlob("/admin/metrics/neighborhood/csv"),
    importCsv: (file) => postCsv("/admin/metrics/neighborhood/csv", file),
  },
  siteSettings: {
    get: () => request("/admin/metrics/site-settings"),
    upsert: (data) => request("/admin/metrics/site-settings", { method: "POST", body: data }),
  },
};
