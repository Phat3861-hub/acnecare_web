import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Descriptions, Tag, Button, Spin, Divider, Rate } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import {
  fetchAppointmentDetail,
  clearDetailState,
} from "../../store/slice/AppointmentSlice";
import dayjs from "dayjs";

const DoctorAppointmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { appointmentDetail: detail, loading } = useSelector(
    (state) => state.appointment,
  );

  useEffect(() => {
    dispatch(fetchAppointmentDetail(id));
    return () => dispatch(clearDetailState());
  }, [dispatch, id]);

  if (loading || !detail)
    return (
      <div className="text-center p-20">
        <Spin size="large" />
      </div>
    );

  return (
    <div className="p-8 max-w-4xl mx-auto bg-white my-8 rounded-xl shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Chi tiết ca khám</h2>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          Quay lại
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
        <img
          src={detail.patientAvatar || "https://via.placeholder.com/50"}
          alt="patient"
          className="w-16 h-16 rounded-full border-2 border-white shadow-sm"
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

      <Descriptions bordered column={2} className="mb-6" size="small">
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
        <Descriptions.Item label="Hình thức">{detail.mode}</Descriptions.Item>

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
          {detail.paymentStatus}
        </Descriptions.Item>
      </Descriptions>

      {/* Hiển thị Link nếu có */}
      {detail.meetingUrl && (
        <div className="mb-6 p-3 bg-gray-50 border border-gray-200 rounded text-sm">
          <span className="font-medium text-gray-700">Link phòng khám: </span>
          <a
            href={detail.meetingUrl}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 underline"
          >
            {detail.meetingUrl}
          </a>
        </div>
      )}

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
        <p className="text-gray-500 italic">
          Bệnh nhân chưa để lại đánh giá cho ca khám này.
        </p>
      )}
    </div>
  );
};

export default DoctorAppointmentDetail;
