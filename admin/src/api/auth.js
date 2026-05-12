import { request } from "./client";

export const authApi = {
  login: (email, password) =>
    request("/auth/login", { method: "POST", body: { email, password } }),
  me: () => request("/auth/me"),
  refresh: () => request("/auth/refresh", { method: "POST" }),
};
