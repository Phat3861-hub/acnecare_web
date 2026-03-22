import { http } from "../api/config";

export const productService = {
  getAllProducts: () => http.get("/products"),
  getProductsByCategory: (categoryId) =>
    http.get(`/categories/${categoryId}/products`),
  createProduct: (formData) =>
    http.post("/products", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  updateProduct: (id, formData) =>
    http.put(`/products/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  deleteProduct: (id) => http.delete(`/products/${id}`),
  updateApprovalStatus: (id, status) =>
    http.patch(`/products/${id}/approval-status?status=${status}`),
};
