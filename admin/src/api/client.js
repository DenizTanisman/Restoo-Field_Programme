const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8003";

const TOKEN_KEY = "opencard_admin_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

let onUnauthorized = null;
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

export async function request(path, { method = "GET", body, headers = {}, isFormData = false } = {}) {
  const token = getToken();
  const finalHeaders = { ...headers };
  if (token) finalHeaders.Authorization = `Bearer ${token}`;
  if (!isFormData && body !== undefined) {
    finalHeaders["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    setToken(null);
    if (onUnauthorized) onUnauthorized();
    throw new Error("Yetkisiz");
  }

  if (!res.ok) {
    let detail = `${res.status}`;
    try {
      const data = await res.json();
      if (Array.isArray(data.detail)) {
        // Pydantic 422 validation: [{loc, msg, type, ...}]
        detail = data.detail
          .map((d) => {
            const field = Array.isArray(d.loc) ? d.loc.filter((p) => p !== "body").join(".") : "";
            const msg = String(d.msg || "").replace(/^Value error,\s*/i, "");
            return field ? `${field}: ${msg}` : msg;
          })
          .join(" · ");
      } else {
        detail = data.detail || JSON.stringify(data);
      }
    } catch {
      detail = (await res.text()) || detail;
    }
    throw new Error(detail);
  }

  if (res.status === 204) return null;

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}

export async function requestBlob(path) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.blob();
}

export { API_URL };
