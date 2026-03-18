import React, { useState, useEffect } from "react";
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
} from "antd";
import { UserOutlined } from "@ant-design/icons";
import {
  createAppointment,
  resetAppointmentState,
} from "../../store/slice/AppointmentSlice";
import dayjs from "dayjs";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { http } from "../../api/config"; // CHÚ Ý: Bắt buộc import http
import { appointmentService } from "../../services/AppointmentService";

const { TextArea } = Input;
const { Option } = Select;

// Các khung giờ mẫu trong ngày
const TIME_SLOTS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
];

const BookAppointment = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { activeDoctors } = useSelector((state) => state.doctor);
  // Lấy thêm biến error ra để bắt lỗi trùng giờ
  const { loading, success, error } = useSelector((state) => state.appointment);
  const { userInfo } = useSelector((state) => state.user);

  const doctor = activeDoctors.find((doc) => doc.id === doctorId);

  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [selectedTime, setSelectedTime] = useState(null);
  const [disabledSlots, setDisabledSlots] = useState([]);

  const [form] = Form.useForm();

  // ========================================================
  // 1. WEBSOCKET: Lắng nghe khung giờ bị mất
  // ========================================================
  useEffect(() => {
    const stompClient = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/api/ws"),
      debug: (str) => console.log(str),
      onConnect: () => {
        console.log("Đã kết nối WebSocket!");
        stompClient.subscribe(`/topic/doctor/${doctorId}/schedule`, (msg) => {
          const response = JSON.parse(msg.body);

          if (response.type === "SLOT_TAKEN") {
            const takenDateTime = response.data.time;
            const bookerId = response.data.patientId;

            // Gạch mờ cái nút đi
            setDisabledSlots((prev) => [...prev, takenDateTime]);

            // Nếu người dùng đang chọn đúng giờ bị cướp -> Hủy chọn giờ đó ngay
            setSelectedTime((prevTime) => {
              if (prevTime && takenDateTime.includes(prevTime)) return null;
              return prevTime;
            });

            // CHỈ BÁO TOAST NẾU MÌNH KHÔNG PHẢI LÀ NGƯỜI ĐẶT
            if (userInfo && userInfo.id !== bookerId) {
              message.warning(
                `Khung giờ ${dayjs(takenDateTime).format("HH:mm DD/MM")} vừa có người đặt!`,
              );
            }
          }
        });
      },
    });

    stompClient.activate();

    return () => {
      stompClient.deactivate();
    };
  }, [doctorId, userInfo]);

  // ========================================================
  // 2. LOAD GIỜ BẬN TỪ SERVER (Lúc mới vào hoặc đổi ngày)
  // ========================================================
  useEffect(() => {
    const fetchBusyTimes = async () => {
      try {
        const dateStr = selectedDate.format("YYYY-MM-DD");
        // Gọi API qua Service và bóc data ra
        const response = await appointmentService.getBusyTimes(
          doctorId,
          dateStr,
        );
        setDisabledSlots(response.data.result);
      } catch (error) {
        console.error("Lỗi lấy giờ bận:", error);
      }
    };

    if (selectedDate && doctorId) {
      fetchBusyTimes();
    }
  }, [selectedDate, doctorId]);

  // ========================================================
  // 3. XỬ LÝ KẾT QUẢ SAU KHI BẤM "XÁC NHẬN"
  // ========================================================

  // Chuyển trang khi thành công
  useEffect(() => {
    if (success) {
      navigate("/appointment-success");
    }
  }, [success, navigate]);

  // Báo lỗi nếu trùng giờ (Lỗi 400 Bad Request)
  useEffect(() => {
    if (success) {
      navigate("/appointment-success");
    }
  }, [success, navigate]);

  useEffect(() => {
    if (error) {
      message.error(
        error.message ||
          "Không thể đặt lịch. Khung giờ này có thể đã bị người khác chọn trước. Vui lòng thử lại!",
      );
      dispatch(resetAppointmentState());

      // Khung giờ bị cướp nên gọi lại API đồng bộ lại lịch mới nhất
      const dateStr = selectedDate.format("YYYY-MM-DD");
      appointmentService
        .getBusyTimes(doctorId, dateStr)
        .then((response) => setDisabledSlots(response.data.result)) // Nhớ bóc .data.result
        .catch(console.error);
    }
  }, [error, dispatch, doctorId, selectedDate]);

  if (!doctor) {
    return (
      <div className="text-center p-10">
        Không tìm thấy Bác sĩ.{" "}
        <Button onClick={() => navigate("/")}>Quay lại</Button>
      </div>
    );
  }

  const handleBooking = (values) => {
    if (!selectedTime) {
      return message.error("Vui lòng chọn giờ khám!");
    }

    const appointmentTime = `${selectedDate.format("YYYY-MM-DD")}T${selectedTime}:00`;

    const payload = {
      doctorId: doctor.id,
      appointmentTime: appointmentTime,
      mode: values.mode,
      paymentMethod: values.paymentMethod,
      note: values.note,
    };

    dispatch(createAppointment(payload));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 mt-8 bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center border-b pb-6 mb-6">
        <div className="flex items-center gap-4">
          <Avatar
            size={80}
            src={doctor.avatarUrl}
            icon={<UserOutlined />}
            className="shadow-sm"
          />
          <div>
            <h2 className="text-2xl font-bold">
              Bác sĩ {doctor.firstName} {doctor.lastName}
            </h2>
            <p className="text-gray-500">Chuyên khoa Da liễu</p>
          </div>
        </div>
        <Button
          type="default"
          size="large"
          onClick={() => navigate("/")}
          className="font-medium"
        >
          Đổi bác sĩ
        </Button>
      </div>

      <Form form={form} layout="vertical" onFinish={handleBooking}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4">1. Chọn thời gian khám</h3>
            <DatePicker
              className="w-full mb-4"
              size="large"
              value={selectedDate}
              onChange={(date) => {
                setSelectedDate(date);
                setSelectedTime(null);
              }}
              disabledDate={(current) =>
                current && current < dayjs().startOf("day")
              }
              allowClear={false}
            />

            <div className="grid grid-cols-4 gap-3 mt-4">
              {TIME_SLOTS.map((time) => {
                const dateTimeString = `${selectedDate.format("YYYY-MM-DD")}T${time}:00`;
                const isTaken = disabledSlots.includes(dateTimeString);

                return (
                  <Button
                    key={time}
                    disabled={isTaken}
                    type={selectedTime === time ? "primary" : "default"}
                    className={`h-10 ${selectedTime === time ? "bg-indigo-700" : ""} ${isTaken ? "line-through text-red-400" : ""}`}
                    onClick={() => setSelectedTime(time)}
                  >
                    {time}
                  </Button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">2. Thông tin bổ sung</h3>

            <Form.Item
              name="mode"
              label="Hình thức khám"
              rules={[{ required: true, message: "Chọn hình thức!" }]}
            >
              <Select size="large" placeholder="Chọn hình thức">
                <Option value="ONLINE">Khám Online (Qua Video Call)</Option>
                <Option value="OFFLINE">Khám Trực tiếp (Tại phòng khám)</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="paymentMethod"
              label="Phương thức thanh toán"
              rules={[{ required: true, message: "Chọn thanh toán!" }]}
            >
              <Select size="large" placeholder="Chọn phương thức">
                <Option value="CASH">Thanh toán tiền mặt</Option>
                <Option value="VNPAY">Chuyển khoản VNPay</Option>
                <Option value="MOMO">Ví MoMo</Option>
              </Select>
            </Form.Item>

            <Form.Item name="note" label="Ghi chú triệu chứng (Không bắt buộc)">
              <TextArea
                rows={4}
                placeholder="Hãy mô tả tình trạng da của bạn để bác sĩ nắm sơ bộ nhé..."
              />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              size="large"
              className="w-full bg-indigo-800 hover:bg-indigo-700 h-12 text-lg font-bold mt-2"
              loading={loading}
            >
              Xác nhận Đặt lịch
            </Button>
          </div>
        </div>
      </Form>
    </div>
  );
};

export default BookAppointment;
