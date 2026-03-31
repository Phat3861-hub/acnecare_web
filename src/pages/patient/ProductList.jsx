import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts } from "../../store/slice/ProductSlice";
import { fetchCategories } from "../../store/slice/CategorySlice";
import { Input, Spin, Empty, Pagination, Tag } from "antd";
import { SearchOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const ProductList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { products, loading: prodLoading } = useSelector(
    (state) => state.product,
  );
  const { categories, loading: catLoading } = useSelector(
    (state) => state.category,
  );

  const [activeCategory, setActiveCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchCategories());
  }, [dispatch]);

  const filteredProducts = products.filter((product) => {
    const matchCategory =
      activeCategory === "all" || product.category?.id === activeCategory;
    const matchSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  const currentData = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId);
    setCurrentPage(1);
  };

  if (prodLoading || catLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-gray-50">
        <Spin size="large" tip="Đang tải danh mục sản phẩm..." />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4 md:px-12 lg:px-24">
      <div className="max-w-6xl mx-auto">
        {/* HEADER & TABS */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6">
          <h2 className="text-2xl md:text-3xl font-black text-gray-800 m-0">
            Dược Mỹ Phẩm Khuyên Dùng
          </h2>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 w-full lg:w-auto">
            <div className="flex flex-wrap gap-4 text-sm font-medium">
              <span
                onClick={() => handleCategoryChange("all")}
                className={`cursor-pointer px-4 py-2 rounded-full transition-colors ${
                  activeCategory === "all"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white text-gray-500 hover:bg-gray-200"
                }`}
              >
                Tất cả
              </span>
              {categories.map((cat) => (
                <span
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`cursor-pointer px-4 py-2 rounded-full transition-colors ${
                    activeCategory === cat.id
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-white text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {cat.name}
                </span>
              ))}
            </div>

            <Input
              placeholder="Tìm tên, thương hiệu..."
              prefix={<SearchOutlined className="text-gray-400" />}
              className="rounded-full w-full md:w-64 py-2 border-gray-300"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {/* GRID SẢN PHẨM MỚI */}
        {filteredProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              {currentData.map((product) => (
                <div
                  key={product.id}
                  onClick={() => navigate(`/products/${product.id}`)}
                  className="flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 cursor-pointer group"
                >
                  {/* Hình ảnh */}
                  <div className="h-60 p-6 flex items-center justify-center relative bg-gray-50">
                    <img
                      src={
                        product.thumbnailUrl ||
                        "https://via.placeholder.com/200"
                      }
                      alt={product.name}
                      className="h-full object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-500 mix-blend-multiply"
                    />
                    <div className="absolute top-4 left-4">
                      <Tag
                        color="blue"
                        className="rounded-full px-3 font-semibold shadow-sm"
                      >
                        {product.brand}
                      </Tag>
                    </div>
                  </div>

                  {/* Thông tin */}
                  <div className="p-6 flex flex-col flex-1">
                    <div className="text-xs text-gray-400 uppercase font-semibold tracking-wider mb-1">
                      {product.category?.name || "Sản phẩm"}
                    </div>
                    <h3 className="text-gray-800 text-lg font-bold leading-tight line-clamp-2 mb-4 group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </h3>

                    <div className="mt-auto flex justify-between items-center pt-4 border-t border-gray-100">
                      <span className="text-sm font-medium text-gray-500">
                        Xem chi tiết
                      </span>
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <ArrowRightOutlined />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center mt-12">
              <Pagination
                current={currentPage}
                total={filteredProducts.length}
                pageSize={pageSize}
                onChange={(page) => setCurrentPage(page)}
                showSizeChanger={false}
              />
            </div>
          </>
        ) : (
          <Empty
            description={
              <span className="text-gray-400">
                Không tìm thấy sản phẩm nào phù hợp
              </span>
            }
            className="py-20 bg-white rounded-2xl border border-dashed border-gray-200"
          />
        )}
      </div>
    </div>
  );
};

export default ProductList;
