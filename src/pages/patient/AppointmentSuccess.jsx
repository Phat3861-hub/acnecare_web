import React from "react";
import { useSelector, useDispatch } from "react-redux"; // Thêm useDispatch
import { useNavigate, Navigate } from "react-router-dom";
import { Button } from "antd";
import dayjs from "dayjs";
import { resetAppointmentState } from "../../store/slice/AppointmentSlice";
import "./AppointmentPages.css";

const AppointmentSuccess = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  // Lấy dữ liệu lịch khám vừa đặt xong từ Redux
  const { currentAppointment } = useSelector((state) => state.appointment);
  const { userInfo } = useSelector((state) => state.user);

  // Nếu truy cập thẳng vào trang này mà không có data đặt lịch, đá về trang chủ
  if (!currentAppointment) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="appointment-page-container flex items-center justify-center">
      <div className="max-w-3xl w-full mx-auto p-10 text-center appointment-card-main animate-fade-in">
        {/* Header Trạng Thái */}
        <div className="flex justify-between items-center border-b border-gray-100 pb-6 mb-8">
          <h2 className="text-2xl font-black appointment-title m-0">Đặt lịch thành công !</h2>
          <div className="text-lg font-medium">
            Trạng thái: <span className="text-yellow-500">Đang chờ xử lý</span>
          </div>
        </div>

        {/* Ảnh minh họa (Bạn có thể dùng thẻ img trỏ tới file ảnh cúp vàng của bạn) */}
        <div className="flex justify-center mb-8">
          <img
            src="https://img.freepik.com/free-vector/business-team-putting-together-jigsaw-puzzle-isolated-flat-vector-illustration-cartoon-partners-working-connection-teamwork-partnership-cooperation-concept_74855-9814.jpg"
            alt="Success"
            className="h-64 object-contain"
          />
        </div>

        {/* Thông tin chi tiết */}
        <div className="grid grid-cols-2 gap-8 text-left appointment-content-box mb-10 border-none">
          <div>
            <p className="text-lg mb-2">
              <span className="font-bold">Tên bác sĩ:</span>{" "}
              {currentAppointment.doctorName}
            </p>
            <p className="text-lg mb-2">
              <span className="font-bold">Tên người khám:</span>{" "}
              {userInfo?.firstName} {userInfo?.lastName}
            </p>
            <p className="text-gray-500">
              Số điện thoại: {userInfo?.phone || "Chưa cập nhật"}
            </p>
          </div>
          <div>
            <h3 className="text-lg font-bold border-b pb-2 mb-2">
              Thông tin lịch khám
            </h3>
            <p className="text-gray-500 mb-1">
              ID: #{currentAppointment.id.substring(0, 8).toUpperCase()}
            </p>
            <p className="text-gray-500 mb-1">
              Ngày khám:{" "}
              {dayjs(currentAppointment.appointmentTime).format(
                "DD Tháng MM, YYYY",
              )}
            </p>
            <p className="text-gray-500">
              Giờ khám:{" "}
              {dayjs(currentAppointment.appointmentTime).format("HH:mm")}
            </p>
          </div>
        </div>

        <h2 className="text-3xl font-black mb-8 text-gradient">Cảm ơn quý khách !</h2>

        <Button
          type="primary"
          size="large"
          className="appointment-primary-btn px-10 h-14 text-lg font-bold rounded-xl"
          onClick={() => {
            dispatch(resetAppointmentState());
            navigate("/");
          }}
        >
          Trở về trang chủ
        </Button>
      </div>
    </div>
  );
};

export default AppointmentSuccess;
