import { http } from "../api/config";

export const treatmentPlanService = {
  createPlan: (caseId, payload) =>
    http.post(`/treatment-plans/case/${caseId}`, payload),
  updatePlan: (planId, payload) =>
    http.put(`/treatment-plans/${planId}`, payload), // THÊM DÒNG NÀY
  applyToRoutine: (planId) =>
    http.post(`/treatment-plans/${planId}/apply-routine`),
};
