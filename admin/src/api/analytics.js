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
  // Mayıs 2026: CSV endpoint'leri /admin/data-entry/csv/* altında.
  // siteSettings → loyaltyApi'ye taşındı.
  district: {
    list: (params = {}) => request(`/admin/metrics/district${qs(params)}`),
    upsert: (data) => request("/admin/metrics/district", { method: "POST", body: data }),
  },
  neighborhood: {
    list: (params = {}) => request(`/admin/metrics/neighborhood${qs(params)}`),
    upsert: (data) => request("/admin/metrics/neighborhood", { method: "POST", body: data }),
  },
};

export const loyaltyApi = {
  get: () => request("/admin/loyalty"),
  upsert: (data) => request("/admin/loyalty", { method: "POST", body: data }),
  exportCsv: () => requestBlob("/admin/loyalty/csv"),
  importCsv: (file) => postCsv("/admin/loyalty/csv", file),
};

// Birleşik Veri Girişi endpoint'leri (yeni format)
export const dataEntryApi = {
  importCsv: (scope, file) => postCsv(`/admin/data-entry/csv/import?scope=${encodeURIComponent(scope)}`, file),
  exportCsv: (scope, districtId) => {
    const q = districtId ? `&district_id=${encodeURIComponent(districtId)}` : "";
    return requestBlob(`/admin/data-entry/csv/export?scope=${encodeURIComponent(scope)}${q}`);
  },
  fetch: ({ scope, districtId, neighborhoodId, categoryId }) => {
    const p = new URLSearchParams({ scope, district_id: districtId });
    if (neighborhoodId) p.set("neighborhood_id", neighborhoodId);
    if (categoryId) p.set("category_id", categoryId);
    return request(`/admin/data-entry/fetch?${p}`);
  },
  save: (payload) => request("/admin/data-entry/save", { method: "POST", body: payload }),
};
