import React, { useEffect } from "react";
import { Button, Spin, Row, Col, message, Typography } from "antd";
import {
  LeftOutlined,
  RightOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchActiveDoctors } from "../../../store/slice/DoctorSlice";
import { useNavigate } from "react-router-dom";
import "./ListDoctor.css";

const { Title, Text } = Typography;

const ListDoctor = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { activeDoctors, loading } = useSelector((state) => state.doctor);
  const { user } = useSelector((state) => state.user);

  const BRAND_COLOR = "#8C52FF"; // Mã màu thương hiệu của Trinh

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
    dispatch(fetchActiveDoctors());
  }, [dispatch]);

  const handleBookAppointment = (doctorId) => {
    const isLogged = user || localStorage.getItem("userInfo");
    if (!isLogged) {
      message.warning("Vui lòng đăng nhập để tiến hành đặt lịch khám!");
      navigate("/auth/login");
      return;
    }
    navigate(`/book-appointment/${doctorId}`);
  };

  if (loading)
    return (
      <div className="text-center p-20 bg-white">
        <Spin size="large" />
      </div>
    );

  return (
    <div className="py-20 px-4 md:px-12 lg:px-24 doctors-section">
      {/* Tiêu đề phần Bác sĩ */}
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h2
          className="text-3xl md:text-4xl font-black mb-4 tracking-tight"
          style={{ color: "#1a1b3a" }}
        >
          Đội ngũ <span style={{ color: BRAND_COLOR }}>Chuyên gia</span> xuất
          sắc
        </h2>
        <p className="text-gray-500 text-sm md:text-base font-medium">
          Kết nối trực tiếp với các bác sĩ da liễu đầu ngành. Dựa trên hiệu quả
          điều trị và phản hồi thực tế từ hàng nghìn bệnh nhân.
        </p>
      </div>

      <Row gutter={[32, 48]} justify="center">
        {activeDoctors.slice(0, 4).map((doc) => (
          <Col xs={24} sm={12} md={6} key={doc.id}>
            <div
              className="flex flex-col items-center group cursor-pointer doctor-card-dynamic"
              onClick={() => handleBookAppointment(doc.id)}
            >
              {/* Khung ảnh bác sĩ với Border Radius lớn hơn cho mềm mại */}
              <div className="mb-5 relative doctor-img-wrapper">
                <img
                  src={
                    doc.avatarUrl
                      ? getImageUrl(doc.avatarUrl)
                      : "https://i.pravatar.cc/300"
                  }
                  alt={`Dr. ${doc.lastName}`}
                  className="w-full h-full object-cover object-top doctor-img-inner"
                />

                {/* Lớp phủ khi hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#8C52FF]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"></div>

                {/* Badge nhỏ khi hover */}
                <div className="absolute bottom-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 z-20 flex items-center justify-center">
                  <div className="p-2 rounded-full doctor-badge-dynamic flex items-center justify-center">
                    <ArrowRightOutlined />
                  </div>
                </div>
              </div>

              <h3
                className="text-xl font-bold m-0 transition-colors"
                style={{ color: "#1a1b3a" }}
              >
                Dr. {doc.firstName} {doc.lastName}
              </h3>
              <p className="text-gray-400 text-sm mt-1 m-0 font-bold uppercase tracking-widest">
                Chuyên khoa Da liễu
              </p>
            </div>
          </Col>
        ))}

        {activeDoctors.length === 0 && !loading && (
          <div className="text-center w-full text-gray-400 italic py-10">
            Hiện chưa có bác sĩ nào đang hoạt động.
          </div>
        )}
      </Row>

      {/* Nút điều hướng Carousel - Cập nhật màu Tím */}
      <div className="flex justify-center gap-6 mt-16">
        <Button
          shape="circle"
          size="large"
          icon={<LeftOutlined />}
          className="hover:!border-[#8C52FF] hover:!text-[#8C52FF] border-gray-200 text-gray-400 shadow-sm"
        />
        <Button
          shape="circle"
          size="large"
          icon={<RightOutlined />}
          className="!bg-[#8C52FF] !border-[#8C52FF] !text-white shadow-lg shadow-purple-200 hover:brightness-110"
        />
      </div>
    </div>
  );
};

export default ListDoctor;
