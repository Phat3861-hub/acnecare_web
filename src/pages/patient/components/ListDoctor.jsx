// src/pages/patient/components/ListDoctor.jsx
import React, { useEffect } from "react";
import { Card, Button, Avatar, Spin, Row, Col } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchActiveDoctors } from "../../../store/slice/DoctorSlice";
import { useNavigate } from "react-router-dom";

const ListDoctor = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { activeDoctors, loading } = useSelector((state) => state.doctor);

  useEffect(() => {
    // Gọi API lấy danh sách bác sĩ khi component mount
    dispatch(fetchActiveDoctors());
  }, [dispatch]);

  // Xử lý khi bấm nút "Đặt lịch khám"
  const handleBookAppointment = (doctorId) => {
    // Chuyển hướng sang trang đặt lịch, truyền ID bác sĩ qua URL parameters
    navigate(`/book-appointment/${doctorId}`);
  };

  if (loading)
    return (
      <div className="text-center p-10">
        <Spin size="large" />
      </div>
    );

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-bold text-center mb-8 text-indigo-900">
        Đội Ngũ Bác Sĩ Chuyên Môn Cao
      </h2>
      <Row gutter={[24, 24]} justify="center">
        {activeDoctors.map((doc) => (
          <Col xs={24} sm={12} md={8} lg={6} key={doc.id}>
            <Card className="rounded-xl shadow-md hover:shadow-lg transition-shadow border-none overflow-hidden text-center">
              <div className="bg-indigo-50 h-24 absolute top-0 left-0 w-full z-0 rounded-b-[50%] scale-x-150"></div>
              <div className="relative z-10 pt-6">
                <Avatar
                  size={100}
                  src={doc.avatarUrl}
                  icon={<UserOutlined />}
                  className="border-4 border-white shadow-sm"
                />
                <h3 className="mt-4 text-lg font-bold">
                  Bác sĩ {doc.firstName} {doc.lastName}
                </h3>
                <p className="text-gray-500 text-sm mb-6">
                  Chuyên da liễu / 4 năm kinh nghiệm
                </p>
                <Button
                  type="primary"
                  className="bg-indigo-800 hover:bg-indigo-700 w-full rounded-full font-medium h-10"
                  onClick={() => handleBookAppointment(doc.id)}
                >
                  Đặt lịch khám
                </Button>
              </div>
            </Card>
          </Col>
        ))}
        {activeDoctors.length === 0 && !loading && (
          <div className="text-center w-full text-gray-500">
            Hiện chưa có bác sĩ nào đang hoạt động.
          </div>
        )}
      </Row>
    </div>
  );
};

export default ListDoctor;
