import React, { useEffect, useState } from "react";
import { Button, Spin, Tag, Typography } from "antd";
import {
  LeftOutlined,
  RightOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchProducts } from "../../../store/slice/ProductSlice";

const { Title, Text } = Typography;

const HomeProducts = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { products, loading } = useSelector((state) => state.product);
  const [displayProducts, setDisplayProducts] = useState([]);
  const BRAND_COLOR = "#8C52FF"; // Màu tím logo của Trinh

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

  useEffect(() => {
    if (products.length === 0) {
      dispatch(fetchProducts());
    }
  }, [dispatch, products.length]);

  const shuffleProducts = () => {
    if (products.length > 0) {
      const shuffled = [...products].sort(() => 0.5 - Math.random());
      setDisplayProducts(shuffled.slice(0, 2));
    }
  };

  useEffect(() => {
    shuffleProducts();
  }, [products]);

  return (
    <div className="py-20 px-4 md:px-12 lg:px-24 flex flex-col md:flex-row gap-12 items-center bg-[#fcfcfc]">
      {/* Cột trái: Giới thiệu & Điều hướng */}
      <div className="w-full md:w-1/3 text-center md:text-left">
        <h2
          className="text-3xl md:text-5xl font-black mb-4 leading-[1.1] tracking-tight"
          style={{ color: "#1a1b3a" }}
        >
          Giải pháp <span style={{ color: BRAND_COLOR }}>trị mụn</span>
          <br />
          tối ưu nhất.
        </h2>

        <div
          onClick={() => navigate("/products")}
          className="group text-gray-500 mb-8 inline-flex items-center gap-2 cursor-pointer font-bold uppercase tracking-widest text-xs transition-all hover:opacity-80"
        >
          <span className="border-b-2 border-gray-300 group-hover:border-[#8C52FF] transition-all">
            Khám phá tất cả sản phẩm
          </span>
          <ArrowRightOutlined style={{ color: BRAND_COLOR }} />
        </div>

        <div className="flex gap-4 justify-center md:justify-start">
          <Button
            shape="circle"
            size="large"
            icon={<LeftOutlined />}
            className="border-gray-200 text-gray-400 hover:!border-[#8C52FF] hover:!text-[#8C52FF] shadow-sm"
            onClick={shuffleProducts}
          />
          <Button
            shape="circle"
            size="large"
            icon={<RightOutlined />}
            className="!bg-[#8C52FF] !border-[#8C52FF] !text-white shadow-lg shadow-purple-200 hover:brightness-110"
            onClick={shuffleProducts}
          />
        </div>
      </div>

      {/* Cột phải: 2 Cards sản phẩm nổi bật */}
      <div className="w-full md:w-2/3 flex flex-col sm:flex-row gap-8 min-h-[380px]">
        {loading ? (
          <div className="w-full flex justify-center items-center">
            <Spin size="large" tip="Đang tìm kiếm sản phẩm tốt nhất..." />
          </div>
        ) : displayProducts.length > 0 ? (
          displayProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => navigate(`/products/${product.id}`)}
              className="flex-1 bg-white rounded-[24px] overflow-hidden border border-transparent shadow-md hover:shadow-2xl hover:shadow-purple-100 hover:-translate-y-2 transition-all duration-500 cursor-pointer group flex flex-col"
            >
              {/* Ảnh sản phẩm */}
              <div className="h-56 bg-gray-50/50 overflow-hidden relative p-8 flex items-center justify-center">
                <img
                  src={
                    getImageUrl(product.thumbnailUrl) ||
                    "https://via.placeholder.com/500"
                  }
                  alt={product.name}
                  className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute top-4 left-4">
                  <Tag
                    style={{ backgroundColor: BRAND_COLOR }}
                    className="text-white border-none rounded-full px-3 py-0.5 font-bold shadow-sm m-0 text-[10px] uppercase tracking-wider"
                  >
                    {product.brand}
                  </Tag>
                </div>
              </div>

              {/* Thông tin chi tiết */}
              <div className="p-6 flex flex-col flex-1">
                <h3
                  className="font-bold text-lg mb-2 line-clamp-2 transition-colors group-hover:text-[#8C52FF]"
                  style={{ color: "#1a1b3a" }}
                >
                  {product.name}
                </h3>
                <p className="text-sm text-gray-400 mb-6 line-clamp-3 leading-relaxed">
                  {product.description}
                </p>
                <div
                  className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] mt-auto pt-4 border-t border-gray-50"
                  style={{ color: BRAND_COLOR }}
                >
                  Chi tiết sản phẩm <RightOutlined className="text-[8px]" />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="w-full flex items-center justify-center text-gray-400 italic">
            Dữ liệu sản phẩm đang được cập nhật...
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeProducts;
