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

  // 3. WEBSOCKET ĐỂ KHÓA GIỜ TỨC THÌ
  useEffect(() => {
    const stompClient = new Client({
      webSocketFactory: () => new SockJS("http://localhost:9090/api/ws"),
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
    const endOfDay = dayjs(`${baseDate}T17:00:00`);

    // Dùng durationMinutes từ chính Dịch vụ mà bệnh nhân đã chọn (Mặc định 30p nếu ko có)
    const duration = selectedServiceObj.durationMinutes || 30;

    while (currentSlot.isBefore(endOfDay)) {
      const slotStart = currentSlot;
      const slotEnd = currentSlot.add(duration, "minute");

      const isAvailable = availableSchedules.some((schedule) => {
        const schStart = dayjs(schedule.startTime);
        const schEnd = dayjs(schedule.endTime);
        return (
          (slotStart.isSame(schStart) || slotStart.isAfter(schStart)) &&
          (slotEnd.isSame(schEnd) || slotEnd.isBefore(schEnd))
        );
      });

      if (isAvailable) {
        slots.push(slotStart.format("YYYY-MM-DDTHH:mm:00"));
      }

      currentSlot = slotStart.add(30, "minute"); // Cứ mỗi 30p vẽ 1 nút
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
    <div className="max-w-5xl mx-auto p-6 mt-8 bg-white rounded-xl shadow-sm border border-gray-100 mb-10">
      <div className="flex justify-between items-center border-b pb-6 mb-6">
        <div className="flex items-center gap-4">
          <Avatar
            size={80}
            src={doctor.avatarUrl}
            icon={<UserOutlined />}
            className="shadow-sm"
          />
          <div>
            <h2 className="text-2xl font-bold m-0 text-gray-800">
              Bác sĩ {doctor.firstName} {doctor.lastName}
            </h2>
            <p className="text-gray-500 m-0 mt-1">Chuyên khoa Da liễu</p>
          </div>
        </div>
        <Button onClick={() => navigate("/")} className="font-medium">
          Đổi bác sĩ
        </Button>
      </div>

      <Form form={form} layout="vertical" onFinish={handleBooking}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* =======================================================
              CỘT TRÁI: CHỌN DỊCH VỤ (BƯỚC 1)
              ======================================================= */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-gray-800 border-l-4 border-indigo-600 pl-3">
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
              <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-lg animate-fade-in">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600 font-medium">Thời lượng:</span>
                  <span className="font-semibold bg-white px-2 py-1 rounded text-sm text-indigo-700">
                    {selectedServiceObj.durationMinutes} phút
                  </span>
                </div>
                <div className="flex justify-between items-center text-lg mt-3 pt-3 border-t border-indigo-100/50">
                  <span className="text-gray-800 font-bold">Phí dịch vụ:</span>
                  <span className="font-bold text-indigo-700 text-xl">
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
                <Option value="VNPAY">Chuyển khoản VNPay</Option>
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
            <h3 className="text-lg font-bold mb-4 text-gray-800 border-l-4 border-indigo-600 pl-3">
              2. Chọn Ngày & Giờ khám
            </h3>

            <DatePicker
              className="w-full mb-4 h-12 text-lg font-medium"
              value={selectedDate}
              onChange={(date) => setSelectedDate(date || dayjs())}
              disabledDate={(current) =>
                current && current < dayjs().startOf("day")
              }
              allowClear={false}
              format="DD/MM/YYYY"
              disabled={!selectedServiceObj} // Khóa lịch nếu chưa chọn dịch vụ
            />

            <div className="min-h-[250px] border border-gray-200 p-5 rounded-xl bg-gray-50 mb-6 relative">
              <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <ClockCircleOutlined className="text-indigo-600" /> Các khung
                giờ có sẵn:
              </p>

              {!selectedServiceObj ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-white/80 rounded-xl backdrop-blur-sm z-10">
                  <InfoCircleOutlined className="text-3xl mb-2 text-indigo-400" />
                  <p className="font-medium text-gray-500">
                    Vui lòng chọn Dịch vụ (Bước 1) <br />
                    để xem khung giờ rảnh tương ứng.
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
                        type={isSelected ? "primary" : "default"}
                        className={`h-11 font-medium transition-all ${isSelected ? "bg-indigo-600 shadow-md transform scale-105 border-indigo-600" : isBusy ? "line-through text-gray-400 bg-gray-200 border-transparent cursor-not-allowed" : "bg-white text-gray-700 border-gray-300 hover:border-indigo-400 hover:text-indigo-600"}`}
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
              className="w-full bg-indigo-700 hover:bg-indigo-600 h-14 text-lg font-bold shadow-lg rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
              loading={loading}
              disabled={!selectedTime || !selectedServiceObj}
            >
              Hoàn tất Đặt lịch khám
            </Button>
          </div>
        </div>
      </Form>
    </div>
  );
};

export default BookAppointment;
