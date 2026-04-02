import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  Card,
  Button,
  Avatar,
  DatePicker,
  Select,
  Input,
  Form,
  message,
  Spin,
  Divider,
  Alert,
} from "antd";
import {
  UserOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import {
  createAppointment,
  resetAppointmentState,
} from "../../store/slice/AppointmentSlice";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { appointmentService } from "../../services/AppointmentService";
import "./BookAppointment.css";

dayjs.extend(isBetween);

const { TextArea } = Input;
const { Option } = Select;

const BookAppointment = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const { activeDoctors } = useSelector((state) => state.doctor);
  const { loading, success, error } = useSelector((state) => state.appointment);
  const { userInfo } = useSelector((state) => state.user);

  const doctor = activeDoctors.find((doc) => doc.id === doctorId);

  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [selectedTime, setSelectedTime] = useState(null);

  const [services, setServices] = useState([]);
  const [availableSchedules, setAvailableSchedules] = useState([]);
  const [busyTimes, setBusyTimes] = useState([]);

  const [selectedServiceObj, setSelectedServiceObj] = useState(null);
  const [fetchingSchedules, setFetchingSchedules] = useState(false);

  // 1. LẤY DỊCH VỤ CỦA BÁC SĨ MỘT LẦN DUY NHẤT
  useEffect(() => {
    if (doctorId) {
      appointmentService
        .getDoctorServices(doctorId)
        .then((res) => setServices(res.data.result))
        .catch(console.error);
    }
  }, [doctorId]);

  // 2. HÀM TẢI LỊCH (ĐƯỢC GỌI KHI ĐỔI NGÀY HOẶC ĐỔI DỊCH VỤ)
  const fetchSchedulesAndBusyTimes = useCallback(
    async (date, serviceObj) => {
      if (!doctorId || !date || !serviceObj) {
        setAvailableSchedules([]);
        return;
      }

      setFetchingSchedules(true);
      setSelectedTime(null);
      try {
        const dateStr = date.format("YYYY-MM-DD");
        // Truyền thêm serviceObj.id vào API getAvailableSchedules
        const [scheduleRes, busyRes] = await Promise.all([
          appointmentService.getAvailableSchedules(
            doctorId,
            dateStr,
            serviceObj.id,
          ),
          appointmentService.getBusyTimes(doctorId, dateStr),
        ]);

        setAvailableSchedules(scheduleRes.data.result);
        setBusyTimes(busyRes.data.result);
      } catch (error) {
        console.error("Lỗi tải lịch rảnh:", error);
      } finally {
        setFetchingSchedules(false);
      }
    },
    [doctorId],
  );

  // Trigger khi người dùng Đổi ngày hoặc Đổi Dịch vụ
  useEffect(() => {
    fetchSchedulesAndBusyTimes(selectedDate, selectedServiceObj);
  }, [selectedDate, selectedServiceObj, fetchSchedulesAndBusyTimes]);
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  // 3. WEBSOCKET ĐỂ KHÓA GIỜ TỨC THÌ
  useEffect(() => {
    const stompClient = new Client({
      webSocketFactory: () => new SockJS(`${backendUrl}/api/ws`),
      debug: () => {}, // Ẩn log rác
      onConnect: () => {
        stompClient.subscribe(`/topic/doctor/${doctorId}/schedule`, (msg) => {
          const response = JSON.parse(msg.body);
          if (response.type === "SLOT_TAKEN") {
            const takenTime = response.data.time;
            setBusyTimes((prev) => [...prev, takenTime]);
            setSelectedTime((prev) => (prev === takenTime ? null : prev));
            if (userInfo && userInfo.id !== response.data.patientId) {
              message.warning(
                `Khung giờ ${dayjs(takenTime).format("HH:mm")} vừa có người đặt!`,
              );
            }
          } else if (
            response.type === "STATUS_UPDATED" ||
            response.type === "SLOT_FREED"
          ) {
            fetchSchedulesAndBusyTimes(selectedDate, selectedServiceObj);
          }
        });
      },
    });
    stompClient.activate();
    return () => stompClient.deactivate();
  }, [
    doctorId,
    userInfo,
    selectedDate,
    selectedServiceObj,
    fetchSchedulesAndBusyTimes,
  ]);

  // 4. XỬ LÝ CHUYỂN TRANG
  useEffect(() => {
    if (success) {
      navigate("/appointment-success");
    }
    if (error) {
      message.error(
        error.message || "Khung giờ này đã bị lấy. Vui lòng chọn giờ khác!",
      );
      dispatch(resetAppointmentState());
      fetchSchedulesAndBusyTimes(selectedDate, selectedServiceObj);
    }
  }, [
    success,
    error,
    navigate,
    dispatch,
    selectedDate,
    selectedServiceObj,
    fetchSchedulesAndBusyTimes,
  ]);

  // ========================================================
  // THUẬT TOÁN: TỰ ĐỘNG BĂM NHỎ THỜI GIAN (8:00 -> 17:00)
  // ========================================================
  const generateTimeSlots = () => {
    const slots = [];
    if (!selectedDate || availableSchedules.length === 0 || !selectedServiceObj)
      return slots;

    const baseDate = selectedDate.format("YYYY-MM-DD");
    let currentSlot = dayjs(`${baseDate}T08:00:00`);
    const endOfDay = dayjs(`${baseDate}T18:00:00`);

    // Dùng durationMinutes từ chính Dịch vụ mà bệnh nhân đã chọn (Mặc định 30p nếu ko có)
    const duration = selectedServiceObj.durationMinutes || 30;

    while (currentSlot.isBefore(endOfDay)) {
      const slotStart = currentSlot;
      const slotEnd = slotStart.add(duration, "minute");

      const isPast =
        selectedDate.isSame(dayjs(), "day") && slotStart.isBefore(dayjs());

      const isAvailable = availableSchedules.some((schedule) => {
        const workStart = dayjs(schedule.startTime);
        const workEnd = dayjs(schedule.endTime);

        return (
          (slotStart.isSame(workStart) || slotStart.isAfter(workStart)) &&
          (slotEnd.isSame(workEnd) || slotEnd.isBefore(workEnd))
        );
      });

      if (isAvailable && !isPast) {
        // Chỉ push nếu giờ đó bác sĩ rảnh và chưa trôi qua
        slots.push(slotStart.format("YYYY-MM-DDTHH:mm:00"));
      }

      // 🚨 ĐÃ SỬA LỖI LOGIC: Dùng biến duration thay vì hardcode số 30
      currentSlot = slotStart.add(duration, "minute");
    }
    return slots;
  };

  const validSlots = generateTimeSlots();

  if (!doctor) {
    return (
      <div className="text-center p-10">
        Không tìm thấy Bác sĩ.{" "}
        <Button onClick={() => navigate("/")}>Quay lại</Button>
      </div>
    );
  }

  // 5. SUBMIT ĐẶT LỊCH
  const handleBooking = (values) => {
    if (!selectedTime) {
      return message.error("Vui lòng chọn khung giờ khám (Bước 2)!");
    }

    const payload = {
      doctorId: doctor.id,
      serviceId: values.serviceId,
      appointmentTime: selectedTime,
      mode: values.mode,
      paymentMethod: values.paymentMethod,
      note: values.note,
    };

    dispatch(createAppointment(payload));
  };

  const handleServiceChange = (serviceId) => {
    const svc = services.find((s) => s.id === serviceId);
    setSelectedServiceObj(svc);
    if (svc) {
      form.setFieldsValue({ mode: svc.mode });
    }
  };

  return (
    <div className="booking-page-container">
    <div className="max-w-5xl mx-auto p-8 booking-card-main">
      <div className="flex justify-between items-center border-b border-gray-100 pb-6 mb-8">
        <div className="flex items-center gap-4">
          <Avatar
            size={80}
            src={doctor.avatarUrl}
            icon={<UserOutlined />}
            className="shadow-sm"
          />
          <div>
            <h2 className="text-2xl font-black m-0 booking-title">
              Bác sĩ {doctor.firstName} {doctor.lastName}
            </h2>
            <p className="text-gray-500 m-0 mt-1">Chuyên khoa Da liễu</p>
          </div>
        </div>
        <Button onClick={() => navigate("/book-appointment")} className="font-medium">
          Đổi bác sĩ
        </Button>
      </div>

      <Form form={form} layout="vertical" onFinish={handleBooking}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <h3 className="text-lg font-bold mb-6 booking-step-title">
              1. Lựa chọn Dịch vụ
            </h3>

            <Form.Item
              name="serviceId"
              label="Bạn muốn thực hiện dịch vụ nào?"
              rules={[
                { required: true, message: "Vui lòng chọn dịch vụ trước!" },
              ]}
            >
              <Select
                size="large"
                placeholder="--- Bấm vào đây để chọn dịch vụ ---"
                onChange={handleServiceChange}
                options={services.map((s) => ({
                  value: s.id,
                  label: `${s.serviceName} (${s.mode === "ONLINE" ? "Trực tuyến" : "Trực tiếp"})`,
                }))}
              />
            </Form.Item>

            {selectedServiceObj && (
              <div className="mb-6 p-5 booking-info-box animate-fade-in">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-600 font-medium">Thời lượng:</span>
                  <span className="font-bold bg-white/60 px-3 py-1 rounded-full text-sm text-[#8C52FF] shadow-sm">
                    {selectedServiceObj.durationMinutes} phút
                  </span>
                </div>
                <div className="flex justify-between items-center text-lg mt-4 pt-4 border-t border-[rgba(140,82,255,0.1)]">
                  <span className="text-[#1e255e] font-black">Phí dịch vụ:</span>
                  <span className="font-black text-[#8C52FF] text-2xl">
                    {selectedServiceObj.price.toLocaleString("vi-VN")}{" "}
                    {selectedServiceObj.currency}
                  </span>
                </div>
              </div>
            )}

            <Form.Item
              name="mode"
              label="Hình thức thực hiện"
              className="hidden"
            >
              <Input /> {/* Ẩn đi vì tự động map theo Dịch vụ */}
            </Form.Item>

            <Form.Item
              name="paymentMethod"
              label={
                <span className="font-medium text-gray-700">
                  Phương thức thanh toán
                </span>
              }
              rules={[
                { required: true, message: "Chọn phương thức thanh toán!" },
              ]}
            >
              <Select size="large" placeholder="Chọn thanh toán">
                <Option value="CASH">Tiền mặt tại phòng khám</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="note"
              label={
                <span className="font-medium text-gray-700">
                  Ghi chú cho bác sĩ (Tùy chọn)
                </span>
              }
            >
              <TextArea
                rows={4}
                placeholder="Mô tả sơ qua tình trạng mụn hoặc các thuốc bạn đang dùng..."
              />
            </Form.Item>
          </div>

          {/* =======================================================
              CỘT PHẢI: CHỌN GIỜ VÀ XÁC NHẬN (BƯỚC 2)
              ======================================================= */}
          <div>
            <h3 className="text-lg font-bold mb-6 booking-step-title">
              2. Chọn Ngày & Giờ khám
            </h3>

            <DatePicker
              className="w-full mb-4 h-12 text-lg font-medium"
              value={selectedDate}
              onChange={(date) => setSelectedDate(date || dayjs())}
              disabledDate={(current) =>
                current && current.isBefore(dayjs(), "day")
              }
              allowClear={false}
              format="DD/MM/YYYY"
              disabled={!selectedServiceObj} // Khóa lịch nếu chưa chọn dịch vụ
            />

            <div className="min-h-[250px] p-6 mb-6 relative booking-time-container">
              <p className="text-sm font-bold text-[#1e255e] mb-5 flex items-center gap-2">
                <ClockCircleOutlined style={{ color: "#8C52FF" }} /> Các khung
                giờ có sẵn:
              </p>

              {!selectedServiceObj ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 rounded-2xl backdrop-blur-sm z-10 text-center">
                  <InfoCircleOutlined className="text-4xl mb-3 text-[#8C52FF]" />
                  <p className="font-bold text-[#1e255e] m-0">
                    Vui lòng chọn Dịch vụ (Bước 1) <br />
                    <span className="font-medium text-gray-500">để xem khung giờ khám trống.</span>
                  </p>
                </div>
              ) : fetchingSchedules ? (
                <div className="text-center py-10">
                  <Spin size="large" />
                </div>
              ) : validSlots.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {validSlots.map((timeString) => {
                    const timeLabel = dayjs(timeString).format("HH:mm");
                    const isBusy = busyTimes.includes(timeString);
                    const isSelected = selectedTime === timeString;

                    return (
                      <Button
                        key={timeString}
                        disabled={isBusy}
                        type="default"
                        className={`h-12 font-bold time-slot-btn ${isSelected ? "time-slot-btn-selected" : isBusy ? "line-through text-gray-400 bg-gray-100 border-transparent cursor-not-allowed" : "time-slot-btn-default text-gray-600 border-gray-200"}`}
                        onClick={() => setSelectedTime(timeString)}
                      >
                        {timeLabel}
                      </Button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400 bg-white rounded-lg border border-dashed border-gray-200">
                  <p className="mb-0">
                    Bác sĩ chưa có lịch trống cho dịch vụ này vào ngày bạn chọn.
                  </p>
                  <p className="text-xs mt-1">Vui lòng chọn một ngày khác.</p>
                </div>
              )}
            </div>

            <Button
              type="primary"
              htmlType="submit"
              size="large"
              className="w-full h-14 text-lg font-bold flex items-center justify-center gap-2 booking-submit-btn rounded-xl"
              loading={loading}
              disabled={!selectedTime || !selectedServiceObj}
            >
              Hoàn tất Đặt lịch khám
            </Button>
          </div>
        </div>
      </Form>
    </div>
    </div>
  );
};

export default BookAppointment;
