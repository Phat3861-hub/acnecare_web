import { http } from "../api/config";

export const DoctorProfileService = {
  getMyProfile: () => {
    return http.get("/doctors/profile/me");
  },
  updateMyProfile: (data) => {
    return http.put("/doctors/profile/me", data);
  },
};
