import { http } from "../api/config";

export const productService = {
  getAllProducts: () => http.get("/products"),
  getProductsByCategory: (categoryId) =>
    http.get(`/categories/${categoryId}/products`),
  createProduct: (data) => http.post("/products", data),
  updateProduct: (id, data) => http.put(`/products/${id}`, data),
  deleteProduct: (id) => http.delete(`/products/${id}`),
};
