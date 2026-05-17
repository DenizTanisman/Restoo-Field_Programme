const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8003";

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}

export const api = {
  // Districts
  getDistricts: () => request("/districts"),
  getDistrict: (id) => request(`/districts/${id}`),
  getDistrictNeighborhoods: (id) => request(`/districts/${id}/neighborhoods`),
  getDataCoverage: () => request("/districts/data-coverage"),

  // Analytics
  getDistrictAnalytics: (districtId, categoryId = null) => {
    const params = new URLSearchParams({ district_id: districtId });
    if (categoryId) params.set("category_id", categoryId);
    return request(`/analytics/district?${params}`);
  },
  getNeighborhoodAnalytics: (neighborhoodId, categoryId = null) => {
    const params = new URLSearchParams({ neighborhood_id: neighborhoodId });
    if (categoryId) params.set("category_id", categoryId);
    return request(`/analytics/neighborhood?${params}`);
  },

  // Restaurants
  searchRestaurants: (query) =>
    request(`/restaurants/search?q=${encodeURIComponent(query)}`),
  getRestaurantDashboard: (restaurantId) =>
    request(`/restaurants/${restaurantId}/dashboard`),
  listRestaurants: ({ districtId = null, neighborhoodId = null, categoryId = null } = {}) => {
    const params = new URLSearchParams();
    if (districtId) params.set("district_id", districtId);
    if (neighborhoodId !== null && neighborhoodId !== undefined) params.set("neighborhood_id", String(neighborhoodId));
    if (categoryId) params.set("category_id", String(categoryId));
    const qs = params.toString();
    return request(`/restaurants${qs ? `?${qs}` : ""}`);
  },
  createRestaurant: (data) =>
    request("/restaurants", { method: "POST", body: JSON.stringify(data) }),

  // Case Studies
  getCaseStudies: () => request("/case-studies"),

  // Categories
  getCategories: () => request("/categories"),

  // Platforms
  getPlatforms: () => request("/platforms"),

  // Site Settings (loyalty stats etc.)
  getSiteSettings: () => request("/analytics/site-settings"),

  // Comments — cross-district summary
  getCommentsByDistrict: (categoryId = null) => {
    const params = new URLSearchParams();
    if (categoryId) params.set("category_id", categoryId);
    const qs = params.toString();
    return request(`/analytics/comments/by-district${qs ? `?${qs}` : ""}`);
  },
};
