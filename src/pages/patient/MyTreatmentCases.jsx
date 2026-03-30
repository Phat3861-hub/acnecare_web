import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyCases } from "../../store/slice/TreatmentCaseSlice";
import { chatService } from "../../services/ChatService";
import { Spin, Empty, Tag, Button, message as antMessage } from "antd";
import {
  FolderOpenOutlined,
  RightOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

const MyTreatmentCases = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { cases, loading } = useSelector((state) => state.treatmentCase);
  const currentUser = JSON.parse(localStorage.getItem("userInfo"));

  const [connectingDoctorId, setConnectingDoctorId] = useState(null);

  useEffect(() => {
    dispatch(fetchMyCases());
  }, [dispatch]);

  // --- HÀM LIÊN HỆ BÁC SĨ ---
  const handleContactDoctor = async (e, doctorId) => {
    e.stopPropagation(); // 🚨 Chặn sự kiện click vào thẻ card (để không bị nhảy sang trang chi tiết)

    if (!doctorId) {
      return antMessage.error("Không tìm thấy thông tin ID của Bác sĩ!");
    }

    setConnectingDoctorId(doctorId);
    try {
      // 1. Tạo hoặc lấy phòng chat giữa Bệnh nhân và Bác sĩ
      await chatService.createChatRoom(currentUser.id, doctorId);

      // 2. Chuyển hướng sang trang Chat
      antMessage.success("Đang chuyển đến cuộc trò chuyện...");
      navigate("/chat");
    } catch (error) {
      antMessage.error(
        "Không thể kết nối với Bác sĩ lúc này. Vui lòng thử lại sau.",
      );
    } finally {
      setConnectingDoctorId(null);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Spin size="large" description="Đang tải hồ sơ..." />
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-[#1e255e] mb-2 flex items-center gap-3">
          <FolderOpenOutlined /> Hồ sơ Điều trị của tôi
        </h2>
        <p className="text-gray-500">
          Quản lý lịch sử các đợt điều trị da liễu của bạn.
        </p>
      </div>

      {cases.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cases.map((c) => (
            <div
              key={c.id}
              className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col cursor-pointer group relative"
              onClick={() => navigate(`/treatment-cases/${c.id}`)}
            >
              <div className="flex justify-between items-start mb-4">
                <Tag
                  color={c.status === "ACTIVE" ? "green" : "default"}
                  className="rounded-full px-3 font-semibold"
                >
                  {c.status === "ACTIVE" ? "Đang điều trị" : "Đã đóng"}
                </Tag>
                <span className="text-sm font-medium text-gray-400">
                  {dayjs(c.startDate).format("DD/MM/YYYY")}
                </span>
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-1">
                Điều trị với BS. {c.doctorName}
              </h3>
              <p className="text-gray-500 text-sm line-clamp-2 mb-4 flex-1">
                <span className="font-semibold">Vấn đề chính:</span>{" "}
                {c.chiefComplaint || "Không có ghi chú ban đầu"}
              </p>

              {/* Phần Footer của Card */}
              <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 mt-auto">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 font-medium">
                    {c.consultations?.length || 0} lần khám
                  </span>
                  <span className="text-blue-600 font-semibold group-hover:underline flex items-center gap-1">
                    Xem chi tiết <RightOutlined className="text-[10px]" />
                  </span>
                </div>

                {/* NÚT LIÊN HỆ BÁC SĨ */}
                <Button
                  type="default"
                  className="w-full flex items-center justify-center text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-400 rounded-xl h-10 font-medium transition-colors"
                  icon={<MessageOutlined />}
                  onClick={(e) => handleContactDoctor(e, c.doctorId)} // Truyền doctorId vào đây
                  loading={connectingDoctorId === c.doctorId}
                >
                  Nhắn tin cho Bác sĩ
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Empty
          description="Bạn chưa có hồ sơ điều trị nào"
          className="bg-white py-16 rounded-2xl border border-gray-100 shadow-sm"
        />
      )}
    </div>
  );
};

export default MyTreatmentCases;
