import React, { useEffect, useState } from "react";
import { Button, Spin, Tag } from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchProducts } from "../../../store/slice/ProductSlice";

const HomeProducts = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { products, loading } = useSelector((state) => state.product);
  const [displayProducts, setDisplayProducts] = useState([]);

  const getImageUrl = (url) => {
    if (!url) return null;

    const baseUrl = import.meta.env.VITE_BACKEND_URL;

    if (url.startsWith("http")) {
      if (
        url.includes("203.145.47.214") ||
        url.includes("https://acnecare.io.vn/api/")
      ) {
        const parts = url.split("/api/");
        const path = "/api/" + parts[parts.length - 1];
        return `${baseUrl}${path}`;
      }
      return url;
    }

    const cleanPath = url.startsWith("/") ? url : `/${url}`;

    if (cleanPath.startsWith("/api/")) {
      return `${baseUrl}${cleanPath}`;
    }

    return `${baseUrl}/api${cleanPath}`;
  };

  // Gọi API lấy danh sách sản phẩm nếu chưa có
  useEffect(() => {
    if (products.length === 0) {
      dispatch(fetchProducts());
    }
  }, [dispatch, products.length]);

  // Hàm chọn ngẫu nhiên 2 sản phẩm để hiển thị
  const shuffleProducts = () => {
    if (products.length > 0) {
      // Lọc ra các sản phẩm đã được duyệt (nếu cần, nhưng API getAllProducts thường đã lo việc này)
      const shuffled = [...products].sort(() => 0.5 - Math.random());
      setDisplayProducts(shuffled.slice(0, 2)); // Lấy 2 sản phẩm đầu tiên sau khi xáo trộn
    }
  };

  // Tự động xáo trộn lần đầu khi có dữ liệu trả về
  useEffect(() => {
    shuffleProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products]);

  return (
    <div className="py-16 px-4 md:px-12 lg:px-24 flex flex-col md:flex-row gap-10 items-center bg-white">
      {/* Cột trái: Text */}
      <div className="w-full md:w-1/3">
        <h2 className="text-3xl md:text-4xl font-black text-[#1e255e] mb-4 leading-tight">
          Sản phẩm trị mụn
          <br />
          hiệu quả.
        </h2>
        <span
          onClick={() => navigate("/products")}
          className="text-gray-500 underline underline-offset-4 mb-6 inline-block hover:text-[#1e255e] cursor-pointer font-medium"
        >
          Khám phá tất cả
        </span>
        <div className="flex gap-3">
          {/* Nút bấm để xáo trộn đổi sản phẩm khác */}
          <Button
            shape="circle"
            icon={<LeftOutlined />}
            className="border-gray-300 text-gray-500 hover:text-blue-600 hover:border-blue-600"
            onClick={shuffleProducts}
          />
          <Button
            shape="circle"
            icon={<RightOutlined />}
            className="border-gray-300 text-gray-500 hover:text-blue-600 hover:border-blue-600"
            onClick={shuffleProducts}
          />
        </div>
      </div>

      {/* Cột phải: 2 Cards hiển thị sản phẩm */}
      <div className="w-full md:w-2/3 flex flex-col sm:flex-row gap-6 min-h-[300px]">
        {loading ? (
          <div className="w-full flex justify-center items-center">
            <Spin size="large" tip="Đang tải sản phẩm..." />
          </div>
        ) : displayProducts.length > 0 ? (
          displayProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => navigate(`/products/${product.id}`)}
              className="flex-1 border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group flex flex-col"
            >
              {/* Phần ảnh */}
              <div className="h-48 bg-gray-50 overflow-hidden relative p-4 flex items-center justify-center">
                <img
                  // ĐÃ SỬA: Dùng hàm getImageUrl để bọc url lại
                  src={
                    getImageUrl(product.thumbnailUrl) ||
                    "https://via.placeholder.com/500"
                  }
                  alt={product.name}
                  className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                />
                <Tag
                  color="blue"
                  className="absolute top-3 left-3 rounded-full font-bold shadow-sm m-0"
                >
                  {product.brand}
                </Tag>
              </div>

              {/* Phần thông tin */}
              <div className="p-5 flex flex-col flex-1 bg-white">
                <h3 className="font-bold text-[#1e255e] text-base mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {product.name}
                </h3>
                <p className="text-xs text-gray-500 mb-4 line-clamp-3 text-justify flex-1">
                  {product.description}
                </p>
                <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider mt-auto pt-2 border-t border-gray-50">
                  Xem chi tiết <RightOutlined className="text-[10px]" />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="w-full flex items-center justify-center text-gray-400 italic">
            Chưa có sản phẩm nào để hiển thị.
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeProducts;
