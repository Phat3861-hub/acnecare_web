import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Calendar,
  Modal,
  Table,
  Select,
  Tag,
  message,
  Spin,
  Input,
} from "antd";
import dayjs from "dayjs";
import {
  fetchDoctorSchedule,
  updateStatus,
} from "../../store/slice/AppointmentSlice";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { Link } from "react-router-dom";

const { Option } = Select;

const DoctorSchedule = () => {
  const dispatch = useDispatch();

  // Lấy danh sách lịch và thông tin user từ Redux
  const { doctorScheduleList, loading } = useSelector(
    (state) => state.appointment,
  );
  const { userInfo } = useSelector((state) => state.user);

  // States cho Lịch và Modal danh sách bệnh nhân
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dayAppointments, setDayAppointments] = useState([]);

  // States cho Modal nhập Link phòng khám Online
  const [linkModalVisible, setLinkModalVisible] = useState(false);
  const [currentEditAppt, setCurrentEditAppt] = useState(null);
  const [meetingUrl, setMeetingUrl] = useState("");

  // ==============================================
  // 1. TẢI DỮ LIỆU & LỌC THEO NGÀY
  // ==============================================
  useEffect(() => {
    dispatch(fetchDoctorSchedule());
  }, [dispatch]);

  useEffect(() => {
    if (selectedDate && doctorScheduleList) {
      const appointmentsOnDate = doctorScheduleList.filter((app) =>
        dayjs(app.appointmentTime).isSame(selectedDate, "day"),
      );
      setDayAppointments(appointmentsOnDate);
    }
  }, [doctorScheduleList, selectedDate]);

  // ==============================================
  // 2. WEBSOCKET: BÁC SĨ LẮNG NGHE LỊCH MỚI/HỦY
  // ==============================================
  useEffect(() => {
    if (!userInfo?.id) return;

    const stompClient = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/api/ws"),
      debug: (str) => console.log(str),
      onConnect: () => {
        console.log("Doctor đã kết nối WebSocket!");

        // Lắng nghe kênh thông báo của chính Bác sĩ này
        stompClient.subscribe(
          `/topic/doctor/${userInfo.id}/notifications`,
          (msg) => {
            const response = JSON.parse(msg.body);

            if (response.type === "NEW_APPOINTMENT") {
              message.success(response.message);
              dispatch(fetchDoctorSchedule()); // Tải lại lịch trình
            } else if (response.type === "APPOINTMENT_CANCELLED") {
              message.warning(response.message);
              dispatch(fetchDoctorSchedule()); // Tải lại lịch trình
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

  // ==============================================
  // 3. GIAO DIỆN Ô LỊCH (CALENDAR)
  // ==============================================
  const dateCellRender = (value) => {
    const listData =
      doctorScheduleList?.filter((app) =>
        dayjs(app.appointmentTime).isSame(value, "day"),
      ) || [];

    if (listData.length === 0) return null;

    const pendingCount = listData.filter(
      (app) => app.status === "PENDING",
    ).length;

    return (
      <div className="flex flex-col gap-1 mt-1 px-1">
        <div className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded border border-blue-100 text-center">
          Tổng: {listData.length} ca
        </div>

        {pendingCount > 0 && (
          <div className="bg-red-50 text-red-600 text-[10px] px-2 py-1 rounded border border-red-100 text-center font-medium">
            Cần duyệt: {pendingCount} ca
          </div>
        )}
      </div>
    );
  };

  const cellRender = (current, info) => {
    if (info.type === "date") return dateCellRender(current);
    return info.originNode;
  };

  const onSelectDate = (newValue) => {
    setSelectedDate(newValue);
    const appointmentsOnDate =
      doctorScheduleList?.filter((app) =>
        dayjs(app.appointmentTime).isSame(newValue, "day"),
      ) || [];

    setDayAppointments(appointmentsOnDate);
    setIsModalVisible(true);
  };

  // ==============================================
  // 4. XỬ LÝ CẬP NHẬT TRẠNG THÁI LỊCH KHÁM
  // ==============================================
  const handleStatusChange = async (record, newStatus) => {
    // Nếu chọn XÁC NHẬN và là khám ONLINE -> Mở popup hỏi link
    if (newStatus === "CONFIRMED" && record.mode === "ONLINE") {
      setCurrentEditAppt(record);
      setMeetingUrl(record.meetingUrl || "");
      setLinkModalVisible(true);
    } else {
      // Các trường hợp khác -> Gọi API lưu luôn
      try {
        await dispatch(
          updateStatus({ id: record.id, status: newStatus }),
        ).unwrap();
        message.success("Cập nhật trạng thái thành công");
      } catch (error) {
        message.error(error.message || "Lỗi khi cập nhật trạng thái");
      }
    }
  };

  const handleSubmitLink = async () => {
    if (!meetingUrl.trim()) {
      return message.error("Vui lòng nhập đường dẫn phòng khám!");
    }
    try {
      await dispatch(
        updateStatus({
          id: currentEditAppt.id,
          status: "CONFIRMED",
          meetingUrl: meetingUrl,
        }),
      ).unwrap();

      message.success("Xác nhận lịch và gửi Link thành công!");
      setLinkModalVisible(false);
      setMeetingUrl("");
    } catch (error) {
      message.error(error.message || "Lỗi khi xác nhận lịch");
    }
  };

  // ==============================================
  // 5. CẤU HÌNH BẢNG DANH SÁCH BỆNH NHÂN
  // ==============================================
  const columns = [
    {
      title: "Giờ",
      dataIndex: "appointmentTime",
      key: "time",
      render: (time) => (
        <span className="font-medium">{dayjs(time).format("HH:mm")}</span>
      ),
      sorter: (a, b) =>
        dayjs(a.appointmentTime).unix() - dayjs(b.appointmentTime).unix(),
      defaultSortOrder: "ascend",
    },
    {
      title: "Bệnh nhân",
      dataIndex: "patientName",
      key: "patientName",
      render: (name, record) => (
        <div>
          <div className="font-medium text-gray-800">{name}</div>
          <div className="text-xs text-gray-500 mt-1">
            Hình thức:{" "}
            {record.mode === "ONLINE" ? (
              <span className="text-blue-600 font-medium">Trực tuyến</span>
            ) : (
              "Trực tiếp"
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Ghi chú bệnh lý",
      dataIndex: "note",
      key: "note",
      render: (note) => (
        <span className="text-gray-500 text-sm">{note || "-"}</span>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <Select
            value={record.status}
            style={{ width: 130 }}
            onChange={(val) => handleStatusChange(record, val)}
            disabled={
              record.status === "CANCELLED" || record.status === "COMPLETED"
            }
          >
            {/* Các Options giữ nguyên */}
            <Option value="PENDING">
              <Tag color="orange">Chờ duyệt</Tag>
            </Option>
            <Option value="CONFIRMED">
              <Tag color="blue">Đã duyệt</Tag>
            </Option>
            <Option value="COMPLETED">
              <Tag color="green">Hoàn thành</Tag>
            </Option>
            <Option value="REJECTED">
              <Tag color="red">Từ chối</Tag>
            </Option>
            <Option value="CANCELLED" disabled>
              <Tag>Bệnh nhân hủy</Tag>
            </Option>
          </Select>

          {/* NÚT CHUYỂN SANG TRANG CHI TIẾT */}
          <Link
            to={`/doctor/schedule/${record.id}`}
            className="text-blue-600 hover:underline text-sm"
          >
            Chi tiết
          </Link>
        </div>
      ),
    },
  ];

  if (loading && !doctorScheduleList) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Quản lý lịch khám
        </h2>

        {/* LỊCH LÀM VIỆC */}
        <div className="border border-gray-200 p-4 rounded-md shadow-sm bg-white">
          <Calendar cellRender={cellRender} onSelect={onSelectDate} />
        </div>

        {/* MODAL 1: BẢNG DANH SÁCH KHÁM TRONG NGÀY */}
        <Modal
          title={`Danh sách khám ngày ${selectedDate ? selectedDate.format("DD/MM/YYYY") : ""}`}
          open={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={null}
          width={800}
          centered
          destroyOnClose
        >
          {dayAppointments.length > 0 ? (
            <Table
              dataSource={dayAppointments}
              columns={columns}
              rowKey="id"
              pagination={false}
              className="mt-4"
              size="middle"
            />
          ) : (
            <div className="text-center p-8 text-gray-500">
              Không có dữ liệu.
            </div>
          )}
        </Modal>

        {/* MODAL 2: NHẬP LINK MEET CHO LỊCH ONLINE */}
        <Modal
          title="Tạo phòng khám Trực tuyến"
          open={linkModalVisible}
          onOk={handleSubmitLink}
          onCancel={() => {
            setLinkModalVisible(false);
            setMeetingUrl("");
          }}
          okText="Xác nhận & Gửi Link"
          cancelText="Hủy bỏ"
          centered
        >
          <div className="py-4">
            <p className="mb-2 text-gray-600">
              Vui lòng nhập đường dẫn (Google Meet, Zoom, Zalo...) để bệnh nhân{" "}
              <span className="font-medium text-gray-800">
                {currentEditAppt?.patientName}
              </span>{" "}
              có thể tham gia:
            </p>
            <Input
              size="large"
              placeholder="VD: https://meet.google.com/abc-xyz-123"
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
            />
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default DoctorSchedule;
