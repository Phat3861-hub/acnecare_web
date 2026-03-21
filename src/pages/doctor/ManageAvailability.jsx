import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  DatePicker,
  TimePicker,
  Select,
  Input,
  Tag,
  message,
  Popconfirm,
  Space,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { doctorScheduleService } from "../../services/DoctorScheduleService";

const { Option } = Select;
const { TextArea } = Input;

const ManageAvailability = () => {
  const [schedules, setSchedules] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [scheduleRes, serviceRes] = await Promise.all([
        doctorScheduleService.getMySchedules(),
        doctorScheduleService.getMyServices(),
      ]);
      setSchedules(scheduleRes.data.result);
      setServices(serviceRes.data.result);
    } catch (error) {
      message.error("Không thể tải dữ liệu. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddNew = () => {
    setEditingId(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingId(record.id);
    form.setFieldsValue({
      date: dayjs(record.startTime),
      timeRange: [dayjs(record.startTime), dayjs(record.endTime)],
      consultationServiceId: record.consultationServiceId,
      note: record.note,
      status: record.status,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await doctorScheduleService.deleteSchedule(id);
      message.success("Xóa lịch rảnh thành công!");
      fetchData();
    } catch (error) {
      message.error("Lỗi khi xóa lịch rảnh.");
    }
  };

  // LOGIC ĐÃ ĐƯỢC NÂNG CẤP: TỰ ĐỘNG BẮT CA TRỰC QUA ĐÊM
  const handleSave = async (values) => {
    try {
      const { date, timeRange, consultationServiceId, note, status } = values;

      // Lấy ngày chuẩn từ ô DatePicker
      let startDjs = date
        .hour(timeRange[0].hour())
        .minute(timeRange[0].minute())
        .second(0);
      let endDjs = date
        .hour(timeRange[1].hour())
        .minute(timeRange[1].minute())
        .second(0);

      // NẾU GIỜ KẾT THÚC BÉ HƠN HOẶC BẰNG GIỜ BẮT ĐẦU -> CA NÀY VẮT SANG NGÀY HÔM SAU
      if (endDjs.isBefore(startDjs) || endDjs.isSame(startDjs)) {
        endDjs = endDjs.add(1, "day"); // Tự động cộng thêm 1 ngày
      }

      const payload = {
        startTime: startDjs.format("YYYY-MM-DDTHH:mm:00"),
        endTime: endDjs.format("YYYY-MM-DDTHH:mm:00"),
        consultationServiceId,
        note,
        status: status || "AVAILABLE",
      };

      if (editingId) {
        await doctorScheduleService.updateSchedule(editingId, payload);
        message.success("Cập nhật lịch rảnh thành công!");
      } else {
        await doctorScheduleService.createSchedule(payload);
        message.success("Tạo lịch rảnh thành công!");
      }

      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      message.error(
        error.response?.data?.message ||
          "Lỗi khi lưu lịch rảnh. Có thể bị trùng giờ!",
      );
    }
  };

  const columns = [
    {
      title: "Ngày",
      dataIndex: "startTime",
      // ĐÃ NÂNG CẤP: Hiển thị 2 ngày nếu lịch bị vắt chéo
      render: (_, record) => {
        const startFormat = dayjs(record.startTime).format("DD/MM/YYYY");
        const endFormat = dayjs(record.endTime).format("DD/MM/YYYY");

        if (startFormat === endFormat) {
          return (
            <span className="font-bold text-indigo-700">{startFormat}</span>
          );
        } else {
          return (
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-indigo-700">{startFormat}</span>
              <span className="text-[11px] text-gray-500">đến {endFormat}</span>
            </div>
          );
        }
      },
      sorter: (a, b) => dayjs(a.startTime).unix() - dayjs(b.startTime).unix(),
    },
    {
      title: "Khung giờ rảnh",
      // ĐÃ NÂNG CẤP: Hiện Tag "Qua ngày" nếu ngày bị lệch
      render: (_, record) => {
        const isOvernight =
          dayjs(record.startTime).format("DD/MM/YYYY") !==
          dayjs(record.endTime).format("DD/MM/YYYY");
        return (
          <div className="flex items-center">
            <CalendarOutlined className="mr-2 text-gray-400" />
            <span className="font-medium">
              {dayjs(record.startTime).format("HH:mm")} -{" "}
              {dayjs(record.endTime).format("HH:mm")}
            </span>
            {isOvernight && (
              <Tag
                color="red"
                bordered={false}
                className="ml-2 text-[10px] px-1 py-0 leading-tight"
              >
                Qua ngày
              </Tag>
            )}
          </div>
        );
      },
    },
    {
      title: "Dịch vụ khám",
      dataIndex: "consultationServiceName",
      render: (val) => <Tag color="blue">{val || "Chưa gắn dịch vụ"}</Tag>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (status) => (
        <Tag
          color={
            status === "AVAILABLE"
              ? "green"
              : status === "BOOKED"
                ? "red"
                : "default"
          }
        >
          {status}
        </Tag>
      ),
    },
    {
      title: "Ghi chú",
      dataIndex: "note",
      render: (note) => (
        <span className="text-gray-500 text-sm">{note || "-"}</span>
      ),
    },
    {
      title: "Thao tác",
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            className="text-blue-600"
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Xóa lịch rảnh này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              disabled={record.status === "BOOKED"}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 m-0">
              Đăng ký lịch rảnh
            </h2>
            <p className="text-gray-500 m-0 mt-1">
              Quản lý các khung giờ bạn có thể nhận bệnh nhân
            </p>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={handleAddNew}
            className="bg-indigo-600 shadow-md"
          >
            Thêm lịch rảnh
          </Button>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <Table
            columns={columns}
            dataSource={schedules}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </div>

        <Modal
          title={
            <span className="text-lg font-bold">
              {editingId ? "Cập nhật lịch rảnh" : "Đăng ký lịch rảnh mới"}
            </span>
          }
          open={isModalOpen}
          onCancel={() => setIsModalOpen(false)}
          footer={null}
          destroyOnClose
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
            className="mt-4"
          >
            <Form.Item
              name="date"
              label="Chọn Ngày bắt đầu"
              rules={[{ required: true, message: "Vui lòng chọn ngày!" }]}
            >
              <DatePicker
                className="w-full"
                format="DD/MM/YYYY"
                size="large"
                disabledDate={(current) =>
                  current && current < dayjs().startOf("day")
                }
              />
            </Form.Item>

            <Form.Item
              name="timeRange"
              label="Khung giờ rảnh (Từ - Đến)"
              rules={[
                { required: true, message: "Vui lòng chọn khoảng thời gian!" },
              ]}
              extra={
                <span className="text-xs text-gray-400">
                  Gợi ý: Nếu chọn Giờ kết thúc bé hơn Giờ bắt đầu, hệ thống sẽ
                  tự động vắt sang ngày hôm sau.
                </span>
              }
            >
              <TimePicker.RangePicker
                className="w-full"
                format="HH:mm"
                size="large"
                minuteStep={30}
              />
            </Form.Item>

            <Form.Item
              name="consultationServiceId"
              label="Dành cho Dịch vụ khám"
              rules={[
                {
                  required: true,
                  message: "Vui lòng chọn dịch vụ cho lịch này!",
                },
              ]}
            >
              <Select placeholder="Chọn dịch vụ khám" size="large">
                {services.map((svc) => (
                  <Option key={svc.id} value={svc.id}>
                    {svc.serviceName} ({svc.durationMinutes} phút)
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="note" label="Ghi chú nội bộ (Tùy chọn)">
              <TextArea
                rows={2}
                placeholder="Ví dụ: Chỉ ưu tiên bệnh nhân tái khám..."
              />
            </Form.Item>

            {editingId && (
              <Form.Item name="status" label="Trạng thái">
                <Select size="large">
                  <Option value="AVAILABLE">Đang mở (Available)</Option>
                  <Option value="BLOCKED">Tạm khóa (Blocked)</Option>
                </Select>
              </Form.Item>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
              <Button
                type="primary"
                htmlType="submit"
                className="bg-indigo-600"
              >
                {editingId ? "Lưu thay đổi" : "Tạo lịch"}
              </Button>
            </div>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default ManageAvailability;
