import React, { useState, useEffect } from "react";
import {
  Input,
  Button,
  Rate,
  Tag,
  Breadcrumb,
  Spin,
  Empty,
  message,
} from "antd";
import {
  SearchOutlined,
  HomeOutlined,
  CalendarOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { userService } from "../../services/UserService";
import "./DoctorList.css";

const DoctorList = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // 1. GỌI API LẤY DANH SÁCH BÁC SĨ
  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      try {
        const res = await userService.getActiveDoctors();
        const doctorData = res.data?.result || [];
        setDoctors(doctorData);
        setFilteredDoctors(doctorData);
      } catch (error) {
        message.error("Không thể tải danh sách bác sĩ. Vui lòng thử lại sau!");
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  // 2. LOGIC TÌM KIẾM
  useEffect(() => {
    const results = doctors.filter((doc) => {
      const fullName =
        `${doc.lastName || ""} ${doc.firstName || ""}`.toLowerCase();
      // Tạm thời chỉ lọc theo tên, sau này có specialty từ Backend thì cộng thêm vào đây
      return fullName.includes(searchTerm.toLowerCase());
    });
    setFilteredDoctors(results);
  }, [searchTerm, doctors]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#fcfcfc]">
        <Spin size="large" tip="Đang tải danh sách bác sĩ..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 md:px-12 lg:px-24 doctor-page-container">
      <div className="max-w-6xl mx-auto">
        <Breadcrumb className="mb-8">
          <Breadcrumb.Item
            onClick={() => navigate("/")}
            className="cursor-pointer hover:text-blue-600"
          >
            <HomeOutlined />
          </Breadcrumb.Item>
          <Breadcrumb.Item className="font-medium text-gray-700">
            Đội ngũ Bác sĩ
          </Breadcrumb.Item>
        </Breadcrumb>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
          <div>
            <h2 className="text-3xl font-black mb-2 leading-tight doctor-name-text">
              Đội ngũ Bác sĩ <br /> Chuyên khoa Da liễu
            </h2>
            <p className="text-gray-500">
              Chọn bác sĩ phù hợp để bắt đầu hành trình điều trị của bạn.
            </p>
          </div>

          <Input
            size="large"
            placeholder="Tìm tên bác sĩ..."
            prefix={<SearchOutlined className="text-gray-400" />}
            className="rounded-full w-full md:w-80 shadow-sm border-gray-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {filteredDoctors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredDoctors.map((doctor) => (
              <div
                key={doctor.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm flex flex-col group doctor-list-card"
              >
                <div className="relative h-64 overflow-hidden flex justify-center items-end pt-6 doctor-avatar-wrapper">
                  <img
                    // ĐÃ SỬA: Chèn hàm getImageUrl vào đây
                    src={
                      doctor.avatarUrl
                        ? getImageUrl(doctor.avatarUrl)
                        : "https://via.placeholder.com/300x400?text=Doctor"
                    }
                    alt={doctor.firstName}
                    className="h-full object-cover rounded-t-2xl object-top group-hover:scale-105 transition-transform duration-500 w-full"
                  />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full flex items-center gap-1 shadow-sm text-xs font-bold text-green-600">
                    <SafetyCertificateOutlined /> Giấy phép hành nghề
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-xs font-bold text-[#8C52FF] uppercase tracking-wider">
                      {/* Dữ liệu giả lập vì UserResponse chưa có */}
                      {doctor.specialty || "Da liễu Tổng quát"}
                    </div>
                    <div className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      {doctor.experience || "5+"} năm KN
                    </div>
                  </div>

                  <h3 className="text-xl font-black mb-1 line-clamp-1 doctor-name-text">
                    {/* Gộp Họ và Tên */}
                    BS. {doctor.lastName} {doctor.firstName}
                  </h3>

                  <div className="flex items-center gap-2 mb-4">
                    <Rate
                      disabled
                      defaultValue={doctor.rating || 5}
                      className="text-sm text-yellow-400"
                      allowHalf
                    />
                    <span className="text-xs text-gray-400 font-medium">
                      ({doctor.reviews || "100+"} đánh giá)
                    </span>
                  </div>

                  <p className="text-gray-500 text-sm line-clamp-3 mb-4 leading-relaxed flex-1 text-justify">
                    {doctor.description ||
                      "Bác sĩ tận tâm, chuyên xây dựng phác đồ cá nhân hóa kết hợp dược mỹ phẩm an toàn cho làn da của bạn."}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {/* Tag giả lập */}
                    {["Tư vấn tận tâm", "Skincare Routine"].map((tag, idx) => (
                      <Tag
                        key={idx}
                        className="m-0 rounded-full text-[11px] px-2 py-0.5 doctor-badge-tag border-none"
                      >
                        {tag}
                      </Tag>
                    ))}
                  </div>

                  <Button
                    type="primary"
                    size="large"
                    icon={<CalendarOutlined />}
                    className="w-full h-12 rounded-xl font-bold text-base doctor-booking-btn"
                    onClick={() => navigate(`/book-appointment/${doctor.id}`)}
                  >
                    Đặt lịch khám
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty
            description={
              <span className="text-gray-400">
                Không tìm thấy bác sĩ nào phù hợp.
              </span>
            }
            className="col-span-full py-20 bg-white rounded-2xl border border-dashed border-gray-200"
          />
        )}
      </div>
    </div>
  );
};

export default DoctorList;
