import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Typography,
  message,
  Popconfirm,
  Tag,
  Spin,
  Empty,
  Row,
  Col,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  SunOutlined,
  ClockCircleOutlined,
  MoonOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { PatientRoutineService } from "../../services/PatientRoutineService";

const { Title, Text } = Typography;

const MyRoutines = () => {
  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ĐÃ THÊM: Hàm xử lý URL ảnh chuẩn xác cho môi trường thực tế
  const getImageUrl = (url) => {
    if (!url) return null;
    const baseUrl = import.meta.env.VITE_BACKEND_URL;

    // 1. Chuyển IP cũ thành HTTPS mới
    if (url.includes("203.145.47.214:5173")) {
      return url.replace("http://203.145.47.214:5173", baseUrl);
    }

    // 2. Link ngoài chuẩn thì giữ nguyên
    if (url.startsWith("http")) return url;

    // 3. Xử lý link tương đối (nối thêm backend url, tránh trùng /api/)
    const cleanUrl = url.startsWith("/") ? url : `/${url}`;
    if (cleanUrl.startsWith("/api/")) {
      return `${baseUrl}${cleanUrl}`;
    }

    return `${baseUrl}/api${cleanUrl}`;
  };

  const fetchRoutines = async () => {
    setLoading(true);
    try {
      const res = await PatientRoutineService.getMyRoutines();
      setRoutines(res.data?.result || []);
    } catch (error) {
      message.error("Không thể tải danh sách lịch trình!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutines();
  }, []);

  const handleDelete = async (id) => {
    try {
      await PatientRoutineService.deleteRoutine(id);
      message.success("Đã xóa lịch trình thành công!");
      fetchRoutines(); // Load lại data
    } catch (error) {
      message.error("Không thể xóa lịch trình này!");
    }
  };

  // Hàm hỗ trợ render các bước skincare theo từng buổi
  const renderStepsByTime = (steps, timeOfDay, title, icon, colorClass) => {
    // Lọc theo buổi và sắp xếp theo stepOrder
    const filtered = steps
      .filter((s) => s.timeOfDay === timeOfDay)
      .sort((a, b) => a.stepOrder - b.stepOrder);

    if (filtered.length === 0) return null;

    return (
      <div className="mb-4">
        <div className={`flex items-center mb-2 font-semibold ${colorClass}`}>
          {icon} <span className="ml-2">{title}</span>
        </div>
        <div className="flex flex-col gap-2 pl-6 border-l-2 border-gray-100 ml-2">
          {filtered.map((step) => (
            <div
              key={step.id}
              className="bg-gray-50 p-2 rounded flex items-center gap-3"
            >
              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm border">
                {step.stepOrder}
              </div>
              <img
                // ĐÃ SỬA: Bọc hàm getImageUrl
                src={
                  getImageUrl(step.product?.thumbnailUrl) ||
                  "https://via.placeholder.com/40"
                }
                alt="thumb"
                className="w-10 h-10 rounded object-cover border bg-white"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-800 line-clamp-1">
                  {step.product?.name}
                </div>
                {step.notes && (
                  <div className="text-xs text-gray-500 italic mt-0.5">
                    "{step.notes}"
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Title level={3} className="m-0 text-gray-800">
            Lịch Trình Skincare Của Tôi
          </Title>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => navigate("/routine-builder")}
            className="bg-blue-600 font-semibold"
          >
            Tạo Lịch Trình Mới
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center p-10">
            <Spin size="large" />
          </div>
        ) : routines.length === 0 ? (
          <Empty
            description="Bạn chưa thiết kế lịch trình nào"
            className="bg-white p-10 rounded-xl shadow-sm border"
          >
            <Button type="primary" onClick={() => navigate("/routine-builder")}>
              Thiết kế ngay
            </Button>
          </Empty>
        ) : (
          <Row gutter={[24, 24]}>
            {routines.map((routine) => (
              <Col xs={24} md={12} xl={8} key={routine.id}>
                <Card
                  className="rounded-xl shadow-sm h-full hover:shadow-md transition-shadow border-gray-200"
                  actions={[
                    // NÚT CẬP NHẬT
                    <Button
                      type="text"
                      className="text-blue-600"
                      icon={<EditOutlined />}
                      // Truyền toàn bộ data của routine này sang trang Builder
                      onClick={() =>
                        navigate("/routine-builder", {
                          state: { editData: routine },
                        })
                      }
                    >
                      Cập nhật
                    </Button>,

                    // NÚT XÓA (Giữ nguyên)
                    <Popconfirm
                      title="Xóa lịch trình này?"
                      description="Hành động này không thể hoàn tác"
                      onConfirm={() => handleDelete(routine.id)}
                      okText="Xóa"
                      cancelText="Hủy"
                      okButtonProps={{ danger: true }}
                    >
                      <Button type="text" danger icon={<DeleteOutlined />}>
                        Xóa
                      </Button>
                    </Popconfirm>,
                  ]}
                >
                  <div className="mb-5 pb-4 border-b">
                    <Title
                      level={4}
                      className="text-blue-600 m-0 mb-1 line-clamp-1"
                      title={routine.routineName}
                    >
                      {routine.routineName}
                    </Title>
                    {routine.note && (
                      <Text
                        type="secondary"
                        className="italic line-clamp-2 text-sm"
                      >
                        {routine.note}
                      </Text>
                    )}
                    <div className="mt-3">
                      <Tag
                        color={routine.isActive ? "green" : "default"}
                        className="m-0"
                      >
                        {routine.isActive ? "Đang áp dụng" : "Tạm ngưng"}
                      </Tag>
                    </div>
                  </div>

                  <div className="overflow-y-auto max-h-[300px] custom-scrollbar pr-2">
                    {renderStepsByTime(
                      routine.steps,
                      "MORNING",
                      "Buổi Sáng",
                      <SunOutlined />,
                      "text-yellow-600",
                    )}
                    {renderStepsByTime(
                      routine.steps,
                      "AFTERNOON",
                      "Buổi Chiều",
                      <ClockCircleOutlined />,
                      "text-orange-500",
                    )}
                    {renderStepsByTime(
                      routine.steps,
                      "EVENING",
                      "Buổi Tối",
                      <MoonOutlined />,
                      "text-blue-600",
                    )}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </div>
    </div>
  );
};

export default MyRoutines;
