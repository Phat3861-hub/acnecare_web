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
  Calendar,
  Badge,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { doctorScheduleService } from "../../services/DoctorScheduleService";
import "./ManageAvailability.css";

const { Option } = Select;
const { TextArea } = Input;

const ManageAvailability = () => {
  const [schedules, setSchedules] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);

  // State cho Modal Form (Thêm/Sửa)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // State cho Calendar & Modal Danh sách theo ngày
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);

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

  // Lọc lịch rảnh cho ngày đang được chọn
  const daySchedules = schedules.filter((s) =>
    dayjs(s.startTime).isSame(selectedDate, "day"),
  );

  // ==========================================
  // LOGIC XỬ LÝ SỰ KIỆN
  // ==========================================
  const handleAddNew = (datePrefill = null) => {
    setEditingId(null);
    form.resetFields();

    // Nếu có chọn sẵn ngày (từ modal chi tiết ngày hoặc bấm chọn lịch) thì điền sẵn
    if (datePrefill && dayjs.isDayjs(datePrefill)) {
      form.setFieldsValue({ date: datePrefill });
    } else if (selectedDate) {
      form.setFieldsValue({ date: selectedDate });
    }

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

      // Xóa xong thì nạp lại data. Nếu data của ngày đó trống thì tự đóng modal.
      const updatedSchedules = schedules.filter((s) => s.id !== id);
      setSchedules(updatedSchedules);

      const remainingDaySchedules = updatedSchedules.filter((s) =>
        dayjs(s.startTime).isSame(selectedDate, "day"),
      );
      if (remainingDaySchedules.length === 0) {
        setIsDayModalOpen(false);
      }
    } catch (error) {
      message.error("Lỗi khi xóa lịch rảnh.");
    }
  };

  const handleSave = async (values) => {
    try {
      const { date, timeRange, consultationServiceId, note, status } = values;

      let startDjs = date
        .hour(timeRange[0].hour())
        .minute(timeRange[0].minute())
        .second(0);
      let endDjs = date
        .hour(timeRange[1].hour())
        .minute(timeRange[1].minute())
        .second(0);

      // Xử lý ca qua đêm
      if (endDjs.isBefore(startDjs) || endDjs.isSame(startDjs)) {
        endDjs = endDjs.add(1, "day");
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

  // ==========================================
  // RENDER GIAO DIỆN CALENDAR (NÂNG CẤP RESPONSIVE)
  // ==========================================
  const dateCellRender = (value) => {
    const listData = schedules.filter((s) =>
      dayjs(s.startTime).isSame(value, "day"),
    );

    if (listData.length === 0) return null;

    // Phân loại số lượng trạng thái
    const availableCount = listData.filter(
      (s) => s.status === "AVAILABLE",
    ).length;
    const bookedCount = listData.filter((s) => s.status === "BOOKED").length;

    // Giao diện cho Máy tính (Desktop): Hiển thị thẻ giờ
    const displayList = listData.slice(0, 2); // Chỉ hiện 2 ca đầu để không làm lịch dài ra
    const overflowCount = listData.length - 2;

    const desktopView = (
      <div className="hidden md:flex flex-col gap-1 mt-1 px-1">
        {displayList.map((item) => (
          <div
            key={item.id}
            className={`text-[10px] md:text-xs px-1.5 py-0.5 rounded truncate font-medium ${
              item.status === "AVAILABLE"
                ? "bg-green-50 text-green-700 border border-green-100"
                : "bg-red-50 text-red-700 border border-red-100"
            }`}
          >
            {dayjs(item.startTime).format("HH:mm")} -{" "}
            {dayjs(item.endTime).format("HH:mm")}
          </div>
        ))}
        {overflowCount > 0 && (
          <div className="text-[10px] md:text-xs text-gray-500 font-semibold text-center mt-0.5">
            + {overflowCount} ca
          </div>
        )}
      </div>
    );

    // Giao diện cho Điện thoại (Mobile): Hiển thị dấu chấm (Dots)
    const mobileView = (
      <div className="flex md:hidden justify-center items-center gap-1 mt-1.5 flex-wrap px-1">
        {availableCount > 0 && (
          <div className="flex items-center gap-0.5">
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500 shadow-sm"></div>
            {availableCount > 1 && (
              <span className="text-[9px] text-green-600 leading-none">
                {availableCount}
              </span>
            )}
          </div>
        )}
        {bookedCount > 0 && (
          <div className="flex items-center gap-0.5 ml-0.5">
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-red-500 shadow-sm"></div>
            {bookedCount > 1 && (
              <span className="text-[9px] text-red-600 leading-none">
                {bookedCount}
              </span>
            )}
          </div>
        )}
      </div>
    );

    return (
      <>
        {desktopView}
        {mobileView}
      </>
    );
  };

  const cellRender = (current, info) => {
    if (info.type === "date") return dateCellRender(current);
    return info.originNode;
  };

  const onSelectDate = (newValue, info) => {
    setSelectedDate(newValue);
    // Chỉ mở Modal khi người dùng click trực tiếp vào 1 ô ngày (không mở khi đổi tháng)
    if (info.source === "date") {
      setIsDayModalOpen(true);
    }
  };

  // ==========================================
  // CẤU HÌNH CỘT CHO BẢNG TRONG MODAL CHI TIẾT
  // ==========================================
  const columns = [
    {
      title: "Khung giờ",
      render: (_, record) => {
        const isOvernight =
          dayjs(record.startTime).format("DD/MM/YYYY") !==
          dayjs(record.endTime).format("DD/MM/YYYY");
        return (
          <div className="flex items-center whitespace-nowrap">
            <CalendarOutlined className="mr-2 text-gray-400" />
            <span className="font-semibold text-indigo-700">
              {dayjs(record.startTime).format("HH:mm")} -{" "}
              {dayjs(record.endTime).format("HH:mm")}
            </span>
            {isOvernight && (
              <Tag
                color="red"
                bordered={false}
                className="ml-2 text-[10px] px-1.5 py-0 leading-tight"
              >
                Qua ngày
              </Tag>
            )}
          </div>
        );
      },
      sorter: (a, b) => dayjs(a.startTime).unix() - dayjs(b.startTime).unix(),
    },
    {
      title: "Dịch vụ",
      dataIndex: "consultationServiceName",
      render: (val) => (
        <Tag color="blue" className="whitespace-nowrap">
          {val || "Chưa gắn dịch vụ"}
        </Tag>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (status) => (
        <Badge
          status={
            status === "AVAILABLE"
              ? "success"
              : status === "BOOKED"
                ? "error"
                : "default"
          }
          text={
            <span className="font-medium whitespace-nowrap">
              {status === "AVAILABLE" ? "Đang mở" : "Đã đặt"}
            </span>
          }
        />
      ),
    },
    {
      title: "Thao tác",
      align: "center",
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EditOutlined />}
            className="text-blue-600 hover:bg-blue-50 px-2"
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
              className="px-2"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    // Bỏ padding mặc định khi ở mobile, giữ padding lớn ở tablet/PC
    <div className="p-3 sm:p-4 md:p-8 manage-availability-container min-h-screen">
      <div className="max-w-6xl mx-auto bg-white manage-availability-card p-6 md:p-8">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-black manage-availability-title m-0">
              Thêm thời gian làm việc
            </h2>
            <p className="text-gray-500 m-0 mt-1 text-sm md:text-base">
              Nhấp vào một ngày trên lịch để xem và cấu hình khung giờ trống.
            </p>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => handleAddNew(selectedDate)}
            className="font-bold w-full sm:w-auto rounded-xl manage-availability-btn"
          >
            Thêm lịch
          </Button>
        </div>
        {/* CALENDAR */}
        <div className="p-2 md:p-6 mt-4 border-t border-gray-100">
          <Calendar
            cellRender={cellRender}
            onSelect={onSelectDate}
            value={selectedDate}
            // Fix lại UI tiêu đề lịch của Ant Design để đẹp hơn trên Mobile
            headerRender={({ value, type, onChange, onTypeChange }) => {
              const start = 0;
              const end = 12;
              const monthOptions = [];

              let current = value.clone();
              const localeData = value.localeData();
              const months = [];
              for (let i = 0; i < 12; i++) {
                current = current.month(i);
                months.push(localeData.monthsShort(current));
              }

              for (let i = start; i < end; i++) {
                monthOptions.push(
                  <Option key={i} value={i} className="month-item">
                    {months[i]}
                  </Option>,
                );
              }

              const year = value.year();
              const month = value.month();
              const options = [];
              for (let i = year - 10; i < year + 10; i += 1) {
                options.push(
                  <Option key={i} value={i} className="year-item">
                    {i}
                  </Option>,
                );
              }
              return (
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center py-4 px-2 mb-2 border-b border-gray-100 gap-3 md:gap-0">
                  <div className="text-lg md:text-xl font-bold text-indigo-900 w-full md:w-auto text-center md:text-left">
                    {value.format("MMMM, YYYY")}
                  </div>
                  <div className="flex gap-2 w-full md:w-auto justify-center md:justify-end">
                    <Select
                      size="small"
                      dropdownMatchSelectWidth={false}
                      className="w-[90px] md:w-24 font-medium"
                      onChange={(newYear) => {
                        const now = value.clone().year(newYear);
                        onChange(now);
                      }}
                      value={year}
                    >
                      {options}
                    </Select>
                    <Select
                      size="small"
                      dropdownMatchSelectWidth={false}
                      value={month}
                      className="w-[100px] md:w-28 font-medium"
                      onChange={(newMonth) => {
                        const now = value.clone().month(newMonth);
                        onChange(now);
                      }}
                    >
                      {monthOptions}
                    </Select>
                  </div>
                </div>
              );
            }}
          />
        </div>

        {/* MODAL CHI TIẾT DANH SÁCH THEO NGÀY */}
        <Modal
          title={
            <div className="text-lg md:text-xl font-bold text-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center pr-6 border-b pb-3 gap-3 sm:gap-0">
              <span className="truncate w-full sm:w-auto">
                Ngày {selectedDate.format("DD/MM/YYYY")}
              </span>
              <Button
                type="primary"
                size="middle"
                icon={<PlusOutlined />}
                onClick={() => handleAddNew(selectedDate)}
                className="bg-indigo-600 w-full sm:w-auto"
              >
                Thêm ca
              </Button>
            </div>
          }
          open={isDayModalOpen}
          onCancel={() => setIsDayModalOpen(false)}
          footer={null}
          width={700}
          centered
          style={{ padding: "0 10px" }}
          closeIcon={
            <CloseCircleOutlined className="text-xl text-gray-400 hover:text-red-500 transition-colors mt-2" />
          }
        >
          {daySchedules.length > 0 ? (
            <div className="overflow-x-auto mt-4 custom-scrollbar pb-2">
              <Table
                columns={columns}
                dataSource={daySchedules}
                rowKey="id"
                pagination={false}
                size="middle"
                scroll={{ x: "max-content" }} // Cho phép cuộn ngang bảng trên mobile
              />
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <CalendarOutlined className="text-5xl text-gray-200 mb-4 block" />
              Bạn chưa có lịch rảnh nào trong ngày này.
              <br />
              <span className="text-sm mt-1 inline-block">
                Hãy nhấn "Thêm ca" để đăng ký.
              </span>
            </div>
          )}
        </Modal>

        {/* MODAL FORM THÊM / SỬA */}
        <Modal
          title={
            <span className="text-lg md:text-xl font-bold">
              {editingId
                ? "Cập nhật lịch làm việc"
                : "Đăng ký lịch làm việc mới"}
            </span>
          }
          open={isModalOpen}
          onCancel={() => setIsModalOpen(false)}
          footer={null}
          zIndex={1050}
          style={{ padding: "0 10px" }}
          centered
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
            className="mt-6"
          >
            <Form.Item
              name="date"
              label={
                <span className="font-medium text-sm md:text-base">
                  Chọn Ngày
                </span>
              }
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
              label={
                <span className="font-medium text-sm md:text-base">
                  Khung giờ (Từ - Đến)
                </span>
              }
              rules={[
                { required: true, message: "Vui lòng chọn khoảng thời gian!" },
              ]}
              extra={
                <span className="text-xs text-orange-500">
                  *Lưu ý: Nếu khung giờ kết thúc trước hoặc bằng giờ bắt đầu, hệ
                  thống sẽ tự động hiểu là qua ngày hôm sau.
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
              label={
                <span className="font-medium text-sm md:text-base">
                  Dịch vụ khám
                </span>
              }
              rules={[
                {
                  required: true,
                  message: "Vui lòng chọn dịch vụ!",
                },
              ]}
            >
              <Select placeholder="-- Chọn dịch vụ khám --" size="large">
                {services.map((svc) => (
                  <Option key={svc.id} value={svc.id}>
                    {svc.serviceName} ({svc.durationMinutes} phút)
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="note"
              label={
                <span className="font-medium text-sm md:text-base">
                  Ghi chú nội bộ (Tùy chọn)
                </span>
              }
            >
              <TextArea
                rows={2}
                placeholder="Ví dụ: Chỉ ưu tiên bệnh nhân tái khám..."
              />
            </Form.Item>

            {editingId && (
              <Form.Item
                name="status"
                label={
                  <span className="font-medium text-sm md:text-base">
                    Trạng thái
                  </span>
                }
              >
                <Select size="large">
                  <Option value="AVAILABLE">
                    <Badge status="success" text="Đang mở (Available)" />
                  </Option>
                  <Option value="BLOCKED">
                    <Badge status="error" text="Tạm khóa (Blocked)" />
                  </Option>
                </Select>
              </Form.Item>
            )}

            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8 pt-4 border-t">
              <Button
                size="large"
                onClick={() => setIsModalOpen(false)}
                className="w-full sm:w-auto"
              >
                Hủy
              </Button>
              <Button
                size="large"
                type="primary"
                htmlType="submit"
                className="bg-indigo-600 w-full sm:w-auto px-8"
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
