import React, { useEffect } from "react";
import { Button, Spin, Row, Col, message } from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchActiveDoctors } from "../../../store/slice/DoctorSlice";
import { useNavigate } from "react-router-dom";

const ListDoctor = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { activeDoctors, loading } = useSelector((state) => state.doctor);
  // Lấy thêm state user từ Redux để kiểm tra đăng nhập
  const { user } = useSelector((state) => state.user);

  // ĐÃ SỬA: Thêm hàm xử lý đường dẫn ảnh để fix lỗi 400 và Mixed Content
  const getImageUrl = (url) => {
    if (!url) return null;
    const baseUrl = import.meta.env.VITE_BACKEND_URL;

    // 1. Chuyển đổi IP cũ thành HTTPS mới
    if (url.includes("203.145.47.214:5173")) {
      return url.replace("http://203.145.47.214:5173", baseUrl);
    }

    // 2. Trả về nguyên bản nếu là link ngoài đã chuẩn HTTP/HTTPS
    if (url.startsWith("http")) return url;

    // 3. Xử lý đường dẫn tương đối
    const cleanUrl = url.startsWith("/") ? url : `/${url}`;
    if (cleanUrl.startsWith("/api/")) {
      return `${baseUrl}${cleanUrl}`;
    }

    return `${baseUrl}/api${cleanUrl}`;
  };

  useEffect(() => {
    dispatch(fetchActiveDoctors());
  }, [dispatch]);

  // LOGIC XỬ LÝ CLICK ĐẶT LỊCH
  const handleBookAppointment = (doctorId) => {
    // 1. Kiểm tra xem có user trong Redux hoặc localStorage không
    const isLogged = user || localStorage.getItem("userInfo");

    // 2. Nếu chưa đăng nhập
    if (!isLogged) {
      message.warning("Vui lòng đăng nhập để tiến hành đặt lịch khám!");
      navigate("/auth/login");
      return;
    }

    // 3. Nếu đã đăng nhập, chuyển sang trang đặt lịch
    navigate(`/book-appointment/${doctorId}`);
  };

  if (loading)
    return (
      <div className="text-center p-20 bg-white">
        <Spin size="large" />
      </div>
    );

  return (
    <div className="py-16 px-4 md:px-12 lg:px-24 bg-white">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-3xl md:text-4xl font-black text-[#1e255e] mb-4">
          Bảng xếp hạng bác sĩ da liễu xuất sắc
        </h2>
        <p className="text-gray-500 text-sm md:text-base">
          Điểm qua các bác sĩ da liễu được đánh giá cao dựa trên hiệu quả điều
          trị và phản hồi tích cực từ bệnh nhân, giúp bạn dễ dàng lựa chọn bác
          sĩ phù hợp.
        </p>
      </div>

      <Row gutter={[24, 40]} justify="center">
        {activeDoctors.slice(0, 4).map((doc) => (
          <Col xs={24} sm={12} md={6} key={doc.id}>
            <div
              className="flex flex-col items-center group cursor-pointer"
              onClick={() => handleBookAppointment(doc.id)} // Gắn sự kiện click vào đây
            >
              {/* Ảnh bác sĩ */}
              <div className="w-full aspect-[3/4] overflow-hidden bg-[#e0f0ff] rounded-sm mb-4">
                <img
                  // ĐÃ SỬA: Dùng getImageUrl để bọc url của ảnh lại
                  src={
                    doc.avatarUrl
                      ? getImageUrl(doc.avatarUrl)
                      : "https://i.pravatar.cc/300"
                  }
                  alt={`Dr. ${doc.lastName}`}
                  className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <h3 className="text-lg font-bold text-[#1e255e] m-0">
                Dr. {doc.firstName} {doc.lastName}
              </h3>
              <p className="text-gray-500 text-sm mt-1 m-0">
                HUTECH University
              </p>
            </div>
          </Col>
        ))}
        {activeDoctors.length === 0 && !loading && (
          <div className="text-center w-full text-gray-500">
            Hiện chưa có bác sĩ nào đang hoạt động.
          </div>
        )}
      </Row>

      {/* Nút điều hướng Carousel */}
      <div className="flex justify-center gap-4 mt-12">
        <Button
          shape="circle"
          size="large"
          icon={<LeftOutlined />}
          className="border-gray-400 text-gray-600"
        />
        <Button
          shape="circle"
          size="large"
          icon={<RightOutlined />}
          className="border-gray-400 text-gray-600"
        />
      </div>
    </div>
  );
};

export default ListDoctor;
