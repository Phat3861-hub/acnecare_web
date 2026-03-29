import { http } from "../api/config";

export const treatmentCaseService = {
  getMyCases: () => http.get("/treatment-cases/my-cases"),
  getCasesByPatient: (patientId) =>
    http.get(`/treatment-cases/patient/${patientId}`),
  getCaseById: (caseId) => http.get(`/treatment-cases/${caseId}`),
  getCasesForDoctor: () => http.get("/treatment-cases/doctor/cases"),
};
