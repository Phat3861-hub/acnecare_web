import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts } from "../../store/slice/ProductSlice";
import { fetchCategories } from "../../store/slice/CategorySlice";
import {
  Input,
  Spin,
  Empty,
  Pagination,
  Tag,
  Button,
} from "antd";
import {
  SearchOutlined,
  ArrowRightOutlined,
  AppstoreOutlined,
  FireOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import "./ProductList.css";

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

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchCategory =
        activeCategory === "all" || product.category?.id === activeCategory;

      const matchSearch =
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchCategory && matchSearch;
    });
  }, [products, activeCategory, searchTerm]);

  const currentData = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  if (prodLoading || catLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-slate-50">
        <Spin size="large" tip="Đang tải danh mục sản phẩm..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.08),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.08),_transparent_24%),linear-gradient(to_bottom,_#f8fafc,_#f1f5f9)] py-8 md:py-12 px-4 md:px-8 lg:px-16 xl:px-24">
      <div className="max-w-7xl mx-auto">
        <div className="rounded-[28px] overflow-hidden border border-white/60 shadow-[0_10px_40px_rgba(15,23,42,0.08)] bg-white/80 backdrop-blur-sm">
          <div className="relative px-5 md:px-8 lg:px-10 py-8 md:py-10 bg-gradient-to-r from-slate-950 via-slate-900 to-blue-900 text-white overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_28%)]" />
            <div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-blue-100 text-xs font-semibold tracking-[0.18em] uppercase">
                  <FireOutlined />
                  Recommended products
                </div>

                <h2 className="text-3xl md:text-4xl font-black mt-4 leading-tight">
                  Dược Mỹ Phẩm Khuyên Dùng
                </h2>

                <p className="text-slate-300 mt-3 text-sm md:text-base leading-7">
                  Khám phá các sản phẩm nổi bật theo từng danh mục, tìm kiếm
                  nhanh theo tên hoặc thương hiệu, và xem chi tiết chỉ với một
                  lần chạm.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 min-w-[280px]">
                <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
                  <div className="text-slate-300 text-sm">Tổng sản phẩm</div>
                  <div className="text-3xl font-bold mt-1">{products.length}</div>
                </div>
                <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
                  <div className="text-slate-300 text-sm">Danh mục</div>
                  <div className="text-3xl font-bold mt-1">{categories.length}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-5 md:px-8 lg:px-10 py-6 md:py-8 bg-slate-50/70">
            <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-slate-700 font-semibold mb-4">
                  <AppstoreOutlined className="text-blue-600" />
                  <span>Lọc theo danh mục</span>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleCategoryChange("all")}
                    className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 border ${
                      activeCategory === "all"
                        ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/15 scale-[1.02]"
                        : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600 hover:-translate-y-0.5"
                    }`}
                  >
                    Tất cả
                  </button>

                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryChange(cat.id)}
                      className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 border ${
                        activeCategory === cat.id
                          ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20 scale-[1.02]"
                          : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600 hover:-translate-y-0.5"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="w-full xl:w-[320px]">
                <div className="text-slate-700 font-semibold mb-4">
                  Tìm kiếm sản phẩm
                </div>
                <Input
                  size="large"
                  placeholder="Tìm tên, thương hiệu..."
                  prefix={<SearchOutlined className="text-slate-400" />}
                  className="rounded-2xl h-12 border-slate-200 shadow-sm hover:border-blue-400 focus-within:shadow-md transition-all"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
            </div>
          </div>

          <div className="px-5 md:px-8 lg:px-10 pb-8 md:pb-10">
            {filteredProducts.length > 0 ? (
              <>
                <div className="flex items-center justify-between gap-4 mb-6 pt-2">
                  <div>
                    <h3 className="text-xl md:text-2xl font-bold text-slate-900">
                      Danh sách sản phẩm
                    </h3>
                    <p className="text-slate-500 mt-1">
                      Hiển thị {currentData.length} / {filteredProducts.length} sản phẩm phù hợp
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {currentData.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => navigate(`/products/${product.id}`)}
                      className="group relative flex flex-col rounded-[24px] overflow-hidden border border-slate-200 bg-white shadow-sm cursor-pointer transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-slate-900/10"
                    >
                      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-violet-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                      <div className="relative h-64 p-6 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
                        <div className="absolute top-4 left-4 z-10">
                          <Tag className="rounded-full px-3 py-[2px] border-0 bg-white/90 text-slate-700 shadow-sm font-semibold">
                            {product.brand}
                          </Tag>
                        </div>

                        <div className="absolute top-4 right-4 z-10">
                          <div className="w-10 h-10 rounded-full bg-white/90 shadow-sm flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                            <ArrowRightOutlined />
                          </div>
                        </div>

                        <img
                          src={
                            product.thumbnailUrl ||
                            "https://via.placeholder.com/260"
                          }
                          alt={product.name}
                          className="h-full max-h-[210px] object-contain drop-shadow-[0_12px_20px_rgba(15,23,42,0.12)] transition-all duration-500 group-hover:scale-110 group-hover:-rotate-1 mix-blend-multiply"
                        />
                      </div>

                      <div className="p-6 flex flex-col flex-1">
                        <div className="mb-2">
                          <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 px-3 py-1 text-xs font-semibold">
                            {product.category?.name || "Sản phẩm"}
                          </span>
                        </div>

                        <h3 className="text-slate-900 text-lg md:text-xl font-bold leading-snug line-clamp-2 min-h-[56px] transition-colors duration-300 group-hover:text-blue-600">
                          {product.name}
                        </h3>

                        <p className="text-slate-500 text-sm mt-3 line-clamp-2">
                          Thương hiệu {product.brand}. Nhấn để xem thêm thông tin chi tiết về sản phẩm.
                        </p>

                        <div className="mt-auto pt-5 flex items-center justify-between">
                          <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">
                            Xem chi tiết
                          </span>

                          <Button
                            type="text"
                            className="!px-0 !text-blue-600 hover:!text-blue-700 font-semibold"
                            icon={<ArrowRightOutlined />}
                          >
                            Mở
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-center mt-10">
                  <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
                    <Pagination
                      current={currentPage}
                      total={filteredProducts.length}
                      pageSize={pageSize}
                      onChange={(page) => setCurrentPage(page)}
                      showSizeChanger={false}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="py-8">
                <Empty
                  description={
                    <span className="text-slate-500">
                      Không tìm thấy sản phẩm nào phù hợp
                    </span>
                  }
                  className="py-16 bg-white rounded-[24px] border border-dashed border-slate-300 shadow-sm"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductList;