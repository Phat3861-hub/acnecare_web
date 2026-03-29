import { http } from "../api/config";

export const brandService = {
  getMyProfile: () => http.get("/brands/profile/me"),
  updateMyProfile: (data) => http.put("/brands/profile/me", data),

  getBrandProfileById: (id) => http.get(`/brands/profile/${id}`),
  updateBrandProfileByAdmin: (id, data) =>
    http.put(`/brands/profile/${id}`, data),
};
