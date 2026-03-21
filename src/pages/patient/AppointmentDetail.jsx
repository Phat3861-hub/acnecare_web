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
        stompClient.subscribe(
          `/topic/patient/${userInfo.id}/notifications`,
          (msg) => {
            const response = JSON.parse(msg.body);
            if (response.type === "STATUS_UPDATED") {
              const updatedAppointment = response.data;
              message.info(
                `Bác sĩ vừa cập nhật trạng thái lịch khám của bạn thành: ${updatedAppointment.status}`,
              );
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
    <div className="p-8 max-w-4xl mx-auto bg-white my-8 rounded-xl shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Chi tiết lịch hẹn</h2>
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
          <span className="font-mono text-gray-500">{detail.id}</span>
        </Descriptions.Item>

        {/* BỔ SUNG DỊCH VỤ KHÁM BÊN BỆNH NHÂN */}
        <Descriptions.Item label="Dịch vụ" span={2}>
          <span className="font-bold text-indigo-700 text-base">
            {detail.serviceName || "Khám da liễu tổng quát"}
          </span>
        </Descriptions.Item>

        <Descriptions.Item label="Trạng thái">
          <Tag
            color={
              detail.status === "COMPLETED"
                ? "green"
                : detail.status === "CANCELLED"
                  ? "default"
                  : detail.status === "PENDING"
                    ? "orange"
                    : "blue"
            }
          >
            {detail.status}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Hình thức">
          <span className="font-medium">
            {detail.mode === "ONLINE" ? "Trực tuyến" : "Trực tiếp"}
          </span>
        </Descriptions.Item>

        <Descriptions.Item label="Ngày khám">
          <b className="text-gray-800">
            {dayjs(detail.appointmentTime).format("DD/MM/YYYY")}
          </b>
        </Descriptions.Item>
        <Descriptions.Item label="Giờ khám">
          <b className="text-gray-800">
            {dayjs(detail.appointmentTime).format("HH:mm")}
          </b>
        </Descriptions.Item>

        <Descriptions.Item label="Thanh toán">
          {detail.paymentMethod}
        </Descriptions.Item>
        <Descriptions.Item label="Trạng thái T.Toán">
          <Tag color={detail.paymentStatus === "PAID" ? "green" : "red"}>
            {detail.paymentStatus}
          </Tag>
        </Descriptions.Item>

        <Descriptions.Item label="Ghi chú bệnh lý" span={2}>
          {detail.note ? (
            <span className="text-gray-600">{detail.note}</span>
          ) : (
            <i className="text-gray-400">Không có ghi chú</i>
          )}
        </Descriptions.Item>
      </Descriptions>

      <Divider orientation="left">Thông tin Bác sĩ</Divider>
      <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
        <img
          src={detail.doctorAvatar || "https://via.placeholder.com/50"}
          alt="doctor"
          className="w-16 h-16 rounded-full object-cover border border-gray-200"
        />
        <div>
          <h3 className="text-lg font-bold text-gray-800 m-0">
            Bác sĩ {detail.doctorName}
          </h3>
          <p className="text-gray-500 text-sm m-0 mt-1">Chuyên khoa Da liễu</p>
        </div>
      </div>

      {detail.mode === "ONLINE" && detail.meetingUrl && (
        <>
          <Divider orientation="left">Phòng khám Online</Divider>
          <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-lg">
            <p className="text-gray-700 mb-2">
              Bác sĩ đã tạo phòng khám trực tuyến. Vui lòng bấm vào link dưới
              đây khi đến giờ:
            </p>
            <a
              href={detail.meetingUrl}
              target="_blank"
              rel="noreferrer"
              className="text-indigo-600 font-bold underline text-lg block"
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
            {detail.rating ? (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-gray-700">
                    Đánh giá của bạn:
                  </span>
                  <Rate disabled defaultValue={detail.rating} />
                </div>
                <p className="text-gray-600 bg-white p-4 rounded-md border border-gray-100 italic m-0 shadow-sm">
                  "{detail.review}"
                </p>
              </div>
            ) : (
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
                  label={
                    <span className="font-medium">Mức độ hài lòng của bạn</span>
                  }
                  rules={[{ required: true, message: "Vui lòng chọn số sao!" }]}
                >
                  <Rate className="text-2xl" />
                </Form.Item>
                <Form.Item
                  name="review"
                  label={<span className="font-medium">Nhận xét chi tiết</span>}
                >
                  <Input.TextArea
                    rows={4}
                    placeholder="Bác sĩ tư vấn rất nhiệt tình, giải đáp thắc mắc cặn kẽ..."
                    className="rounded-md"
                  />
                </Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  className="bg-indigo-600"
                >
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
