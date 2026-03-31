import { http } from "../api/config";

export const categoryService = {
  getAllCategories: () => http.get("/categories"),
  getCategoryById: (id) => http.get(`/categories/${id}`),
  createCategory: (data) => http.post("/categories", data),
  updateCategory: (id, data) => http.put(`/categories/${id}`, data),
  deleteCategory: (id) => http.delete(`/categories/${id}`),
};
