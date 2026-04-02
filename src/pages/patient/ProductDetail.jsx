import React, { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProductById,
  fetchProducts,
  clearCurrentProduct,
} from "../../store/slice/ProductSlice";
import {
  Spin,
  Button,
  Tag,
  Typography,
  Breadcrumb,
  Image,
  Descriptions,
} from "antd";
import {
  ShoppingCartOutlined,
  PlusSquareOutlined,
  HomeOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
import "./ProductDetail.css";

const { Title, Paragraph } = Typography;

const ProductDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Tham chiếu đến khung cuộn ngang
  const scrollRef = useRef(null);

  const { currentProduct, products, loading } = useSelector(
    (state) => state.product,
  );

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
    dispatch(fetchProductById(id));
    // Load sẵn danh sách tất cả sản phẩm nếu Redux đang rỗng để làm phần Gợi ý
    if (products.length === 0) {
      dispatch(fetchProducts());
    }

    return () => {
      dispatch(clearCurrentProduct()); // Xóa state khi rời trang để chống lag/nháy dữ liệu
    };
  }, [dispatch, id, products.length]);

  // HÀM XỬ LÝ CUỘN NGANG KHI BẤM NÚT TRÁI/PHẢI
  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.offsetWidth; // Cuộn một khoảng bằng đúng độ rộng khung nhìn (tương đương 4 sản phẩm)
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // LOGIC LỌC SẢN PHẨM GỢI Ý
  // Loại bỏ sản phẩm đang xem & Ưu tiên xếp các sản phẩm CÙNG DANH MỤC lên trước
  const suggestedProducts = products
    .filter(
      (p) => p.id !== currentProduct?.id && p.approvalStatus === "APPROVED",
    )
    .sort((a, b) => {
      if (a.category?.id === currentProduct?.category?.id) return -1;
      if (b.category?.id === currentProduct?.category?.id) return 1;
      return 0;
    })
    .slice(0, 10); // Lấy tối đa 10 sản phẩm để gợi ý

  if (loading || !currentProduct) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spin size="large" tip="Đang tải thông tin sản phẩm..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 md:px-12 lg:px-24 detail-page-container">
      <div className="max-w-6xl mx-auto">
        <Breadcrumb className="mb-6">
          <Breadcrumb.Item
            onClick={() => navigate("/")}
            className="cursor-pointer hover:text-blue-600 transition-colors"
          >
            <HomeOutlined />
          </Breadcrumb.Item>
          <Breadcrumb.Item
            onClick={() => navigate("/products")}
            className="cursor-pointer hover:text-blue-600 transition-colors"
          >
            Sản phẩm
          </Breadcrumb.Item>
          <Breadcrumb.Item className="font-medium text-gray-700">
            {currentProduct.name}
          </Breadcrumb.Item>
        </Breadcrumb>

        {/* ========================================== */}
        {/* PHẦN 1: THÔNG TIN CHI TIẾT SẢN PHẨM */}
        {/* ========================================== */}
        <div className="bg-white overflow-hidden flex flex-col md:flex-row mb-12 detail-product-main border-none">
          {/* Cột trái: Hình ảnh */}
          <div className="w-full md:w-5/12 p-8 flex flex-col items-center justify-center relative detail-img-box">
            <Image
              // ĐÃ SỬA: Bọc hàm getImageUrl
              src={
                currentProduct.thumbnailUrl
                  ? getImageUrl(currentProduct.thumbnailUrl)
                  : "https://via.placeholder.com/400"
              }
              alt={currentProduct.name}
              className="object-contain mix-blend-multiply rounded-lg detail-img-main"
              style={{ maxHeight: "380px" }}
            />

            {/* Gallery ảnh phụ nếu có */}
            {currentProduct.imagesUrl && (
              <div className="flex gap-3 mt-8 overflow-x-auto w-full justify-center hide-scrollbar">
                {currentProduct.imagesUrl.split(",").map((url, idx) => (
                  <Image
                    key={idx}
                    // ĐÃ SỬA: Bọc hàm getImageUrl
                    src={getImageUrl(url.trim())}
                    width={70}
                    height={70}
                    className="object-cover rounded-lg border border-gray-200 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Cột phải: Text */}
          <div className="w-full md:w-7/12 p-8 lg:p-12 flex flex-col">
            <div className="mb-3 flex items-center gap-2">
              <Tag
                color="blue"
                className="text-[13px] px-3 py-1 rounded-full font-bold m-0 border-blue-200 shadow-sm"
              >
                {currentProduct.brand}
              </Tag>
              <Tag className="text-[13px] px-3 py-1 rounded-full m-0 bg-gray-100 border-gray-200 text-gray-600">
                {currentProduct.category?.name}
              </Tag>
            </div>

            <Title
              level={2}
              className="mt-2 mb-6 font-black leading-tight detail-title"
            >
              {currentProduct.name}
            </Title>

            <div className="flex-1">
              <Descriptions column={1} layout="vertical" className="mt-2">
                <Descriptions.Item
                  label={
                    <span className="font-black text-[#1e255e] text-lg">
                      Công dụng & Mô tả
                    </span>
                  }
                >
                  <Paragraph className="text-gray-600 text-justify whitespace-pre-wrap leading-relaxed text-[15px]">
                    {currentProduct.description}
                  </Paragraph>
                </Descriptions.Item>

                {currentProduct.ingredients && (
                  <Descriptions.Item
                    label={
                      <span className="font-black text-[#1e255e] text-lg">
                        Thành phần chính
                      </span>
                    }
                  >
                    <Paragraph className="text-gray-600 text-justify whitespace-pre-wrap leading-relaxed text-[15px] bg-blue-50/50 p-4 rounded-xl border border-blue-50">
                      {currentProduct.ingredients}
                    </Paragraph>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-100 flex flex-col sm:flex-row gap-4">
              <Button
                type="primary"
                size="large"
                icon={<PlusSquareOutlined />}
                className="flex-1 h-[52px] text-[15px] font-bold rounded-xl routine-btn"
                onClick={() => navigate("/routine-builder")}
              >
                Thêm vào Routine
              </Button>

              {currentProduct.affiliateUrl && (
                <Button
                  size="large"
                  icon={<ShoppingCartOutlined />}
                  className="flex-1 h-[52px] text-[15px] font-bold rounded-xl buy-btn"
                  onClick={() =>
                    window.open(currentProduct.affiliateUrl, "_blank")
                  }
                >
                  Mua chính hãng
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* PHẦN 2: SẢN PHẨM GỢI Ý (CAROUSEL)          */}
        {/* ========================================== */}
        {suggestedProducts.length > 0 && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-[#1e255e] m-0">
                Gợi ý cho bạn
              </h3>
              <div className="flex gap-3">
                <Button
                  shape="circle"
                  icon={<LeftOutlined />}
                  onClick={() => scroll("left")}
                  className="hover:text-blue-600 hover:border-blue-600 border-gray-300 text-gray-500 shadow-sm"
                />
                <Button
                  shape="circle"
                  icon={<RightOutlined />}
                  onClick={() => scroll("right")}
                  className="hover:text-blue-600 hover:border-blue-600 border-gray-300 text-gray-500 shadow-sm"
                />
              </div>
            </div>

            {/* Khung cuộn mượt mà (Snap Scrolling) */}
            <div
              ref={scrollRef}
              className="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 hide-scroll"
            >
              {suggestedProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => navigate(`/products/${product.id}`)}
                  className="min-w-[260px] max-w-[260px] snap-start bg-white border border-gray-100 rounded-xl overflow-hidden cursor-pointer flex flex-col suggest-card-dynamic group"
                >
                  <div className="h-48 bg-[#fdfdfd] p-4 flex items-center justify-center relative">
                    <img
                      // ĐÃ SỬA: Bọc hàm getImageUrl
                      src={
                        product.thumbnailUrl
                          ? getImageUrl(product.thumbnailUrl)
                          : "https://via.placeholder.com/200"
                      }
                      alt={product.name}
                      className="h-full object-contain mix-blend-multiply drop-shadow-sm group-hover:scale-110 transition-transform duration-500"
                    />
                    <Tag
                      color="blue"
                      className="absolute top-3 left-3 rounded-full font-bold shadow-sm m-0 text-[10px]"
                    >
                      {product.brand}
                    </Tag>
                  </div>
                  <div className="p-5 flex flex-col flex-1 border-t border-gray-50">
                    <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-1 line-clamp-1">
                      {product.category?.name || "Khác"}
                    </div>
                    <h4 className="text-sm font-bold text-[#1e255e] line-clamp-2 group-hover:text-blue-600 transition-colors leading-snug">
                      {product.name}
                    </h4>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
