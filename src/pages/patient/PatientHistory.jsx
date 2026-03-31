import React, { useEffect } from "react";
import { Table, Tag, Button, Spin, Popconfirm, message } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  cancelMyAppointment,
  fetchMyHistory,
  updateAppointmentLocally,
} from "../../store/slice/AppointmentSlice";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

const PatientHistory = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { historyList, loading } = useSelector((state) => state.appointment);
  const { userInfo } = useSelector((state) => state.user);
  useEffect(() => {
    dispatch(fetchMyHistory());
  }, [dispatch]);

  useEffect(() => {
    if (!userInfo?.id) return;

    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const stompClient = new Client({
      webSocketFactory: () => new SockJS(`${backendUrl}/api/ws`),
      debug: (str) => console.log(str),
      onConnect: () => {
        console.log("Patient đã kết nối WebSocket lắng nghe thông báo!");

        // Lắng nghe kênh cá nhân của Bệnh nhân
        stompClient.subscribe(
          `/topic/patient/${userInfo.id}/notifications`,
          (msg) => {
            const response = JSON.parse(msg.body);

            if (response.type === "STATUS_UPDATED") {
              const updatedAppointment = response.data;

              // 1. Hiển thị thông báo nhỏ
              message.info(
                `Bác sĩ vừa cập nhật trạng thái lịch khám của bạn thành: ${updatedAppointment.status}`,
              );

              // 2. Cập nhật Redux ngay lập tức để UI đổi màu thẻ Tag
              dispatch(updateAppointmentLocally(updatedAppointment));
            }
          },
        );
      },
    });

    stompClient.activate();

    return () => {
      stompClient.deactivate();
    };
  }, [userInfo?.id, dispatch]);

  // Hàm render màu sắc cho Trạng thái
  const getStatusTag = (status) => {
    switch (status) {
      case "PENDING":
        return <Tag color="gold">Đang chờ duyệt</Tag>;
      case "CONFIRMED":
        return <Tag color="blue">Đã xác nhận</Tag>;
      case "COMPLETED":
        return <Tag color="green">Đã khám xong</Tag>;
      case "CANCELLED":
        return <Tag color="default">Đã hủy</Tag>;
      case "REJECTED":
        return <Tag color="red">Từ chối</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const handleCancel = async (id) => {
    try {
      await dispatch(cancelMyAppointment(id)).unwrap(); // Dùng unwrap để bắt lỗi/thành công
      message.success("Đã hủy lịch khám thành công!");
    } catch (error) {
      message.error(error.message || "Không thể hủy lịch khám lúc này.");
    }
  };
  const columns = [
    {
      title: "Bác sĩ",
      dataIndex: "doctorName",
      key: "doctorName",
      render: (name) => <b>Bác sĩ {name}</b>,
    },
    {
      title: "Thời gian",
      dataIndex: "appointmentTime",
      key: "appointmentTime",
      render: (time) => dayjs(time).format("HH:mm - DD/MM/YYYY"),
    },
    {
      title: "Hình thức",
      dataIndex: "mode",
      key: "mode",
      render: (mode) => (
        <Tag color={mode === "ONLINE" ? "cyan" : "purple"}>{mode}</Tag>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => getStatusTag(status),
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            type="primary"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/patient/history/${record.id}`)}
          >
            Chi tiết
          </Button>

          {/* CHỈ HIỆN NÚT HỦY KHI LỊCH ĐANG CHỜ HOẶC ĐÃ XÁC NHẬN */}
          {(record.status === "PENDING" || record.status === "CONFIRMED") && (
            <Popconfirm
              title="Hủy lịch khám"
              description="Bạn có chắc chắn muốn hủy lịch khám này không?"
              onConfirm={() => handleCancel(record.id)}
              okText="Đồng ý"
              cancelText="Đóng"
              okButtonProps={{ danger: true }}
            >
              <Button danger>Hủy</Button>
            </Popconfirm>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Lịch sử khám bệnh của tôi</h2>
      <Table
        columns={columns}
        dataSource={historyList}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 8 }}
      />
    </div>
  );
};

export default PatientHistory;
