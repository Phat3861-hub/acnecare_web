import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Descriptions,
  Tag,
  Button,
  Spin,
  Divider,
  Popconfirm,
  message,
  Rate,
  Input,
  Form,
} from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import {
  fetchAppointmentDetail,
  clearDetailState,
  cancelMyAppointment,
  updateAppointmentLocally,
  submitReview,
} from "../../store/slice/AppointmentSlice";

import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import dayjs from "dayjs";

const AppointmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { appointmentDetail: detail, loading } = useSelector(
    (state) => state.appointment,
  );

  useEffect(() => {
    dispatch(fetchAppointmentDetail(id));
    return () => dispatch(clearDetailState()); // Dọn dẹp khi thoát trang
  }, [dispatch, id]);
  const { userInfo } = useSelector((state) => state.user);
  useEffect(() => {
    if (!userInfo?.id) return;

    const stompClient = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/api/ws"),
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

  const handleCancel = async () => {
    try {
      await dispatch(cancelMyAppointment(id)).unwrap();
      message.success("Đã hủy lịch khám thành công!");
    } catch (error) {
      message.error(error.message || "Không thể hủy lịch khám lúc này.");
    }
  };
  if (loading || !detail)
    return (
      <div className="text-center p-20">
        <Spin size="large" />
      </div>
    );

  return (
    <div className="p-8 max-w-4xl mx-auto bg-white my-8 rounded-xl shadow-sm border">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Chi tiết lịch hẹn</h2>
        <div className="flex gap-3">
          {/* HIỂN THỊ NÚT HỦY NẾU HỢP LỆ */}
          {(detail.status === "PENDING" || detail.status === "CONFIRMED") && (
            <Popconfirm
              title="Hủy lịch khám"
              description="Bạn có chắc chắn muốn hủy lịch khám này không?"
              onConfirm={handleCancel}
              okText="Đồng ý"
              cancelText="Đóng"
              okButtonProps={{ danger: true }}
            >
              <Button danger>Hủy lịch hẹn</Button>
            </Popconfirm>
          )}

          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            Quay lại
          </Button>
        </div>
      </div>

      <Descriptions bordered column={2} className="mb-6">
        <Descriptions.Item label="Mã lịch hẹn" span={2}>
          <span className="font-mono">{detail.id}</span>
        </Descriptions.Item>
        <Descriptions.Item label="Trạng thái">
          <Tag
            color={
              detail.status === "COMPLETED"
                ? "green"
                : detail.status === "CANCELLED"
                  ? "default"
                  : "blue"
            }
          >
            {detail.status}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Hình thức">{detail.mode}</Descriptions.Item>

        <Descriptions.Item label="Ngày khám">
          <b>{dayjs(detail.appointmentTime).format("DD/MM/YYYY")}</b>
        </Descriptions.Item>
        <Descriptions.Item label="Giờ khám">
          <b>{dayjs(detail.appointmentTime).format("HH:mm")}</b>
        </Descriptions.Item>

        <Descriptions.Item label="Phương thức thanh toán">
          {detail.paymentMethod}
        </Descriptions.Item>
        <Descriptions.Item label="Trạng thái thanh toán">
          {detail.paymentStatus}
        </Descriptions.Item>

        <Descriptions.Item label="Ghi chú bệnh lý" span={2}>
          {detail.note || <i>Không có ghi chú</i>}
        </Descriptions.Item>
      </Descriptions>

      <Divider orientation="left">Thông tin Bác sĩ</Divider>
      <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <img
          src={detail.doctorAvatar || "https://via.placeholder.com/50"}
          alt="doctor"
          className="w-16 h-16 rounded-full"
        />
        <div>
          <h3 className="text-lg font-bold">Bác sĩ {detail.doctorName}</h3>
          <p className="text-gray-500 text-sm">Chuyên khoa Da liễu</p>
        </div>
      </div>

      {detail.mode === "ONLINE" && detail.meetingUrl && (
        <>
          <Divider orientation="left">Link phòng khám Online</Divider>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p>
              Bác sĩ đã tạo phòng khám trực tuyến. Vui lòng bấm vào link dưới
              đây khi đến giờ:
            </p>
            <a
              href={detail.meetingUrl}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 font-bold underline"
            >
              {detail.meetingUrl}
            </a>
          </div>
        </>
      )}
      {detail.status === "COMPLETED" && (
        <>
          <Divider orientation="left">Đánh giá chất lượng dịch vụ</Divider>
          <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg">
            {/* Nếu đã đánh giá rồi -> Chỉ hiển thị */}
            {detail.rating ? (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-gray-700">
                    Đánh giá của bạn:
                  </span>
                  <Rate disabled defaultValue={detail.rating} />
                </div>
                <p className="text-gray-600 bg-white p-3 rounded border border-gray-100 italic">
                  "{detail.review}"
                </p>
              </div>
            ) : (
              /* Nếu chưa đánh giá -> Hiện Form */
              <Form
                layout="vertical"
                onFinish={async (values) => {
                  try {
                    await dispatch(
                      submitReview({
                        id: detail.id,
                        rating: values.rating,
                        review: values.review,
                      }),
                    ).unwrap();
                    message.success("Cảm ơn bạn đã gửi đánh giá!");
                  } catch (error) {
                    message.error(error.message || "Gửi đánh giá thất bại.");
                  }
                }}
              >
                <Form.Item
                  name="rating"
                  label="Mức độ hài lòng của bạn"
                  rules={[{ required: true, message: "Vui lòng chọn số sao!" }]}
                >
                  <Rate />
                </Form.Item>
                <Form.Item name="review" label="Nhận xét chi tiết">
                  <Input.TextArea
                    rows={3}
                    placeholder="Bác sĩ tư vấn rất nhiệt tình..."
                  />
                </Form.Item>
                <Button type="primary" htmlType="submit">
                  Gửi đánh giá
                </Button>
              </Form>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AppointmentDetail;
