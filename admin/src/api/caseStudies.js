import { request, requestBlob, API_URL, getToken } from "./client";

function buildForm(data) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined || v === null) continue;
    if (v instanceof File) {
      if (v.size > 0) fd.append(k, v);
    } else if (Array.isArray(v)) {
      fd.append(k, JSON.stringify(v));
    } else {
      fd.append(k, String(v));
    }
  }
  return fd;
}

async function sendMultipart(path, method, data) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: { Authorization: `Bearer ${getToken()}` },
    body: buildForm(data),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `HTTP ${res.status}`);
  }
  return res.json();
}

export const caseStudiesApi = {
  list: () => request("/admin/case-studies"),
  create: (data) => sendMultipart("/admin/case-studies", "POST", data),
  update: (id, data) => sendMultipart(`/admin/case-studies/${id}`, "PUT", data),
  remove: (id) => request(`/admin/case-studies/${id}`, { method: "DELETE" }),
  reorder: (items) =>
    request("/admin/case-studies/reorder", { method: "PATCH", body: items }),
  exportCsv: () => requestBlob("/admin/case-studies/csv"),
};
