import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Descriptions,
  Tag,
  Button,
  Spin,
  Divider,
  Rate,
  Modal,
  Form,
  Input,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import {
  fetchAppointmentDetail,
  clearDetailState,
} from "../../store/slice/AppointmentSlice";
import { appointmentService } from "../../services/AppointmentService";
import { ConsultationService } from "../../services/ConsultationService";
import dayjs from "dayjs";

const { TextArea } = Input;

const DoctorAppointmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { appointmentDetail: detail, loading } = useSelector(
    (state) => state.appointment,
  );

  // States cho Modal Viết phiếu khám
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    dispatch(fetchAppointmentDetail(id));
    return () => dispatch(clearDetailState());
  }, [dispatch, id]);

  // HÀM MỞ MODAL & CẬP NHẬT TRẠNG THÁI
  const handleOpenConsultationModal = async () => {
    if (detail.status !== "COMPLETED") {
      try {
        await appointmentService.updateAppointmentStatus(id, {
          status: "COMPLETED",
        });
        message.success("Đã chuyển trạng thái lịch khám thành Đã hoàn thành!");
        dispatch(fetchAppointmentDetail(id)); // Tải lại chi tiết để cập nhật nhãn trạng thái
      } catch (error) {
        return message.error("Lỗi khi cập nhật trạng thái lịch khám!");
      }
    }
    setIsModalVisible(true);
  };

  const handleSubmitConsultation = async (values) => {
    setSubmitting(true);
    try {
      // Chuẩn hóa dữ liệu: Đảm bảo không bị undefined
      const payload = {
        appointmentId: id,
        chiefComplaint: values.chiefComplaint?.trim() || "",
        assessment: values.assessment?.trim() || "",
        planSummary: values.planSummary?.trim() || "",
        doctorNotes: values.doctorNotes?.trim() || "",
      };

      console.log("🚀 Payload gửi đi:", payload); // In ra để xem dữ liệu có đủ không

      const res = await ConsultationService.createConsultation(payload);

      message.success(
        "Lưu phiếu khám thành công! Hồ sơ đã được tự động cập nhật.",
      );
      setIsModalVisible(false);

      // Chuyển hướng sang trang Hồ sơ điều trị của bệnh nhân
      const newCaseId = res.data.result.caseId;
      navigate(`/doctor/treatment-cases/${newCaseId}`);
    } catch (error) {
      // Lấy data lỗi trực tiếp từ interceptor hoặc response
      const errorData = error.response?.data || error;
      console.log("🚨 FULL LỖI:", errorData);

      // Bắt lỗi @Valid của Spring Boot (nếu có mảng errors)
      if (errorData.errors && Array.isArray(errorData.errors)) {
        message.error(`Thiếu dữ liệu: ${errorData.errors[0].defaultMessage}`);
      }
      // Bắt lỗi AppException của bạn (có message)
      else if (errorData.message) {
        message.error(`Lỗi: ${errorData.message}`);
      } else {
        message.error("Có lỗi 400 xảy ra, vui lòng xem Console!");
      }
    } finally {
      setSubmitting(false);
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
      {/* HEADER QUAY LẠI */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Chi tiết ca khám</h2>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          Quay lại
        </Button>
      </div>

      {/* THÔNG TIN BỆNH NHÂN */}
      <div className="flex items-center gap-4 mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
        <img
          src={detail.patientAvatar || "https://via.placeholder.com/50"}
          alt="patient"
          className="w-16 h-16 rounded-full border-2 border-white shadow-sm object-cover"
        />
        <div>
          <h3 className="text-lg font-bold text-gray-800">
            Bệnh nhân: {detail.patientName}
          </h3>
          <p className="text-gray-500 text-sm m-0">
            Ghi chú bệnh lý:{" "}
            <span className="italic text-gray-700">
              {detail.note || "Không có"}
            </span>
          </p>
        </div>
      </div>

      {/* BẢNG CHI TIẾT */}
      <Descriptions bordered column={2} className="mb-6" size="small">
        <Descriptions.Item label="Dịch vụ khám" span={2}>
          <span className="font-bold text-blue-700 text-base">
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
        <Descriptions.Item label="Hình thức thực hiện">
          <span className="font-medium">
            {detail.mode === "ONLINE" ? "Trực tuyến" : "Trực tiếp"}
          </span>
        </Descriptions.Item>

        <Descriptions.Item label="Ngày khám">
          <b>{dayjs(detail.appointmentTime).format("DD/MM/YYYY")}</b>
        </Descriptions.Item>
        <Descriptions.Item label="Giờ khám">
          <b>{dayjs(detail.appointmentTime).format("HH:mm")}</b>
        </Descriptions.Item>

        <Descriptions.Item label="Thanh toán">
          {detail.paymentMethod}
        </Descriptions.Item>
        <Descriptions.Item label="Trạng thái T.Toán">
          <Tag color={detail.paymentStatus === "PAID" ? "green" : "red"}>
            {detail.paymentStatus}
          </Tag>
        </Descriptions.Item>
      </Descriptions>

      {/* HIỂN THỊ LINK MEET */}
      {detail.meetingUrl && (
        <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-lg text-sm">
          <span className="font-semibold text-gray-700 mb-1 block">
            Link phòng khám trực tuyến:{" "}
          </span>
          <a
            href={detail.meetingUrl}
            target="_blank"
            rel="noreferrer"
            className="text-indigo-600 underline font-medium text-base"
          >
            {detail.meetingUrl}
          </a>
        </div>
      )}

      {/* ĐÁNH GIÁ TỪ BỆNH NHÂN */}
      {detail.status === "COMPLETED" && (
        <>
          <Divider orientation="left">Đánh giá từ Bệnh nhân</Divider>
          {detail.rating ? (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Rate disabled defaultValue={detail.rating} />
                <span className="text-gray-500 text-sm">
                  ({detail.rating}/5 sao)
                </span>
              </div>
              <p className="text-gray-700 m-0 italic">"{detail.review}"</p>
            </div>
          ) : (
            <p className="text-gray-500 italic mb-6">
              Bệnh nhân chưa để lại đánh giá cho ca khám này.
            </p>
          )}
        </>
      )}

      {/* NÚT KÍCH HOẠT QUY TRÌNH TẠO HỒ SƠ */}
      <div className="flex justify-end mt-8">
        {detail.status === "CONFIRMED" || detail.status === "COMPLETED" ? (
          <Button
            type="primary"
            size="large"
            icon={<EditOutlined />}
            className="bg-[#1e255e] font-bold rounded-lg px-8 shadow-md"
            onClick={handleOpenConsultationModal}
          >
            {detail.status === "COMPLETED"
              ? "Viết / Sửa Phiếu Khám"
              : "Hoàn thành & Viết Phiếu Khám"}
          </Button>
        ) : (
          <span className="text-gray-400 italic">
            Chỉ có thể viết phiếu khám khi lịch đã được xác nhận.
          </span>
        )}
      </div>

      {/* MODAL ĐIỀN PHIẾU KHÁM BỆNH */}
      <Modal
        title={
          <span className="text-xl font-bold text-[#1e255e]">
            <EditOutlined /> Phiếu Kết Quả Khám Bệnh
          </span>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={700}
        destroyOnClose
        centered
      >
        <div className="bg-blue-50 text-blue-700 p-3 rounded-lg mb-6 text-sm flex gap-2">
          <CheckCircleOutlined className="mt-1" />
          <span>
            Điền phiếu khám này sẽ tự động khởi tạo (hoặc cập nhật) Hồ sơ Bệnh
            án của <b>{detail.patientName}</b> trong hệ thống.
          </span>
        </div>

        <Form form={form} layout="vertical" onFinish={handleSubmitConsultation}>
          <Form.Item
            label={
              <span className="font-semibold">
                Lý do đến khám (Chief Complaint)
              </span>
            }
            name="chiefComplaint"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập lý do bệnh nhân đến khám!",
              },
            ]}
          >
            <Input
              size="large"
              placeholder="VD: Nổi nhiều mụn viêm vùng má và cằm 2 tuần nay..."
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="font-semibold">
                Đánh giá tình trạng da (Assessment)
              </span>
            }
            name="assessment"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập đánh giá tình trạng da!",
              },
            ]}
          >
            <TextArea
              rows={4}
              placeholder="VD: Da dầu, nhiều bã nhờn. Có mụn viêm sưng đỏ rải rác..."
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="font-semibold text-green-600">
                Tóm tắt hướng xử lý (Plan Summary)
              </span>
            }
            name="planSummary"
          >
            <TextArea
              rows={3}
              placeholder="VD: Kê đơn thuốc bôi giảm viêm, kết hợp sữa rửa mặt kiềm dầu..."
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="font-semibold text-orange-500">
                Ghi chú riêng của Bác sĩ (Doctor Notes - Bệnh nhân không thấy)
              </span>
            }
            name="doctorNotes"
          >
            <TextArea
              rows={2}
              placeholder="Ghi chú nội bộ cho lần tái khám sau..."
            />
          </Form.Item>

          <div className="flex justify-end gap-3 mt-6 border-t pt-4">
            <Button size="large" onClick={() => setIsModalVisible(false)}>
              Hủy bỏ
            </Button>
            <Button
              size="large"
              type="primary"
              htmlType="submit"
              loading={submitting}
              className="bg-blue-600 font-bold px-8"
            >
              Lưu Phiếu Khám
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default DoctorAppointmentDetail;
