import React, { useState, useEffect } from "react";
import {
  List,
  Avatar,
  Typography,
  Card,
  Spin,
  message,
  Table,
  Tag,
  Divider,
  Row,
  Col,
  Input,
  Modal,
  Button,
} from "antd";
import {
  UserOutlined,
  FileSearchOutlined,
  CalendarOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { http } from "../../api/config";
import "./DoctorScanHistory.css";

const { Title, Text } = Typography;
const { Search } = Input;

const classToVietnamese = {
  "dark spot": "Vết thâm",
  blackheads: "Mụn đầu đen",
  whiteheads: "Mụn đầu trắng",
  nodules: "Mụn bọc",
  papules: "Mụn sẩn",
  pustules: "Mụn mủ",
};

const translateToVN = (className) =>
  classToVietnamese[className.toLowerCase().trim()] || className;

const DoctorScanHistory = () => {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [scanHistory, setScanHistory] = useState([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedScan, setSelectedScan] = useState(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setIsLoadingPatients(true);
    try {
      const res = await http.get("/users/patients");
      setPatients(res.data?.result || []);
      setFilteredPatients(res.data?.result || []);
    } catch (error) {
      message.error("Không thể tải danh sách bệnh nhân.");
    } finally {
      setIsLoadingPatients(false);
    }
  };

  const fetchScanHistory = async (patientId) => {
    setIsLoadingHistory(true);
    setScanHistory([]);
    try {
      const res = await http.get(`/acne-predictions/patient/${patientId}`);
      setScanHistory(res.data?.result || []);
    } catch (error) {
      message.error("Không thể tải lịch sử quét da.");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    fetchScanHistory(patient.id);

    // UX CỰC KỲ QUAN TRỌNG TRÊN MOBILE: Tự động cuộn xuống phần chi tiết khi chọn
    if (window.innerWidth < 1024) {
      setTimeout(() => {
        document
          .getElementById("patient-details-section")
          ?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  const handleSearchPatient = (value) => {
    const keyword = value.toLowerCase();
    const filtered = patients.filter(
      (p) =>
        (p.firstName + " " + p.lastName).toLowerCase().includes(keyword) ||
        (p.phone && p.phone.includes(keyword)),
    );
    setFilteredPatients(filtered);
  };

  const columns = [
    {
      title: "Ngày Quét",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text) => (
        <span className="font-medium text-blue-600 whitespace-nowrap">
          <CalendarOutlined className="mr-1.5" />
          {dayjs(text).format("DD/MM/YYYY - HH:mm")}
        </span>
      ),
    },
    {
      title: "Đánh giá",
      dataIndex: "severityLevel",
      key: "severityLevel",
      render: (severity) => {
        let color =
          severity === "Nặng"
            ? "red"
            : severity === "Trung bình"
              ? "orange"
              : severity === "Nhẹ"
                ? "blue"
                : "green";

        return (
          <Tag color={color} className="font-bold whitespace-nowrap">
            {severity?.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: "Phát hiện (AI)",
      key: "details",
      render: (_, record) => (
        <div className="flex flex-wrap gap-1 min-w-[150px] max-w-[250px]">
          {record.details?.map((d, i) => (
            <Tag key={i} className="text-xs m-0 mb-1">
              {translateToVN(d.codeName)}: {d.count}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: "Ghi chú",
      dataIndex: "note",
      key: "note",
      render: (text) => (
        <span className="text-gray-500 text-sm line-clamp-2 min-w-[150px]">
          {text || "-"}
        </span>
      ),
    },
    {
      title: "Hình ảnh",
      key: "action",
      align: "center",
      render: (_, record) => (
        <Button
          type="primary"
          ghost
          size="small"
          icon={<PictureOutlined />}
          onClick={() => {
            setSelectedScan(record);
            setIsImageModalOpen(true);
          }}
          className="whitespace-nowrap"
        >
          Xem ảnh
        </Button>
      ),
    },
  ];

  return (
    // Padding responsive: nhỏ trên mobile, rộng trên tablet/PC
    <div className="doctor-scan-history-container p-3 sm:p-4 md:p-6 lg:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto bg-white doctor-scan-history-card p-4 md:p-8">
        <h2 className="text-xl md:text-2xl font-black doctor-scan-history-title mb-4 md:mb-6">
          Hồ Sơ & Lịch Sử Quét Da
        </h2>

        <Row gutter={[16, 24]}>
          {/* CỘT TRÁI: DANH SÁCH BỆNH NHÂN */}
          <Col xs={24} lg={8} xl={7}>
            <Card
              title={
                <Search
                  placeholder="Tìm tên hoặc SĐT..."
                  onChange={(e) => handleSearchPatient(e.target.value)}
                  className="w-full"
                  allowClear
                />
              }
              // Trên mobile giới hạn chiều cao 350px để không choán hết màn hình, PC thì full
              className="rounded-2xl border-none shadow-sm h-[350px] lg:h-[calc(100vh-120px)] overflow-hidden flex flex-col"
              style={{ background: "#f8f9ff" }}
              bodyStyle={{ padding: 0, flex: 1, overflowY: "auto" }}
            >
              {isLoadingPatients ? (
                <div className="flex justify-center items-center h-full">
                  <Spin />
                </div>
              ) : filteredPatients.length > 0 ? (
                <List
                  dataSource={filteredPatients}
                  renderItem={(item) => (
                    <div
                      onClick={() => handleSelectPatient(item)}
                      className={`p-3 md:p-4 border-b cursor-pointer transition-colors hover:bg-blue-50 
                        ${
                          selectedPatient?.id === item.id
                            ? "bg-blue-100 border-blue-200"
                            : "bg-white"
                        }`}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            className={`${selectedPatient?.id === item.id ? "bg-blue-600" : "bg-blue-400"}`}
                            icon={<UserOutlined />}
                          />
                        }
                        title={
                          <span
                            className={`font-bold ${selectedPatient?.id === item.id ? "text-blue-800" : "text-gray-700"}`}
                          >
                            {item.firstName} {item.lastName}
                          </span>
                        }
                        description={
                          <span className="text-gray-500 text-xs">
                            {item.phone || "Chưa cập nhật SĐT"}
                          </span>
                        }
                      />
                    </div>
                  )}
                />
              ) : (
                <div className="p-6 text-center text-gray-400">
                  Không tìm thấy bệnh nhân nào.
                </div>
              )}
            </Card>
          </Col>

          {/* CỘT PHẢI: CHI TIẾT & LỊCH SỬ QUÉT */}
          <Col xs={24} lg={16} xl={17} id="patient-details-section">
            {selectedPatient ? (
              <Card className="rounded-2xl border-none shadow-sm min-h-[400px] lg:min-h-[calc(100vh-120px)]" style={{ background: "#f8f9ff" }}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-2">
                  <div>
                    <h3 className="text-lg md:text-xl font-bold m-0 text-blue-700">
                      Bệnh nhân: {selectedPatient.firstName}{" "}
                      {selectedPatient.lastName}
                    </h3>
                    <p className="text-gray-500 text-sm m-0 mt-1">
                      Email: {selectedPatient.email || "Không có"}
                    </p>
                  </div>
                </div>

                <Divider className="my-3 md:my-4" />

                {isLoadingHistory ? (
                  <div className="flex justify-center py-20">
                    <Spin size="large" />
                  </div>
                ) : scanHistory.length > 0 ? (
                  <div className="overflow-x-auto custom-scrollbar pb-2">
                    <Table
                      dataSource={scanHistory}
                      columns={columns}
                      rowKey="id"
                      pagination={{ pageSize: 8, showSizeChanger: false }}
                      size="middle"
                      scroll={{ x: "max-content" }} // Cho phép cuộn ngang trên mobile
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 md:py-20 text-gray-400 text-center px-4">
                    <FileSearchOutlined className="text-5xl md:text-6xl mb-4 opacity-50 text-blue-200" />
                    <p className="text-base md:text-lg">
                      Bệnh nhân này chưa có hồ sơ quét da (AI) nào.
                    </p>
                  </div>
                )}
              </Card>
            ) : (
              // Màn hình chờ: Thu gọn trên mobile, bự trên PC
              <div className="rounded-2xl border-none min-h-[400px] shadow-sm lg:min-h-[calc(100vh-120px)] flex flex-col items-center justify-center text-gray-400 p-6 text-center" style={{ background: "#f8f9ff" }}>
                <UserOutlined className="text-4xl lg:text-6xl mb-3 lg:mb-4 opacity-30" />
                <h3 className="text-base lg:text-lg font-medium text-gray-400 m-0">
                  Chọn một bệnh nhân ở cột bên trái để xem hồ sơ
                </h3>
              </div>
            )}
          </Col>
        </Row>
      </div>

      {/* MODAL XEM ẢNH */}
      <Modal
        title={
          <span className="text-lg md:text-xl font-bold">
            Bằng Chứng Y Khoa (AI Bounding Box)
          </span>
        }
        open={isImageModalOpen}
        onCancel={() => setIsImageModalOpen(false)}
        footer={null}
        width={750}
        centered
        style={{ padding: "0 10px" }}
      >
        {selectedScan && (
          <div className="mt-2 md:mt-4">
            <div className="flex flex-col sm:flex-row sm:justify-between bg-gray-50/80 p-3 md:p-4 rounded-lg mb-4 border border-gray-100 gap-3 sm:gap-0">
              <div>
                <p className="m-0 text-gray-500 text-xs uppercase tracking-wider">
                  Ngày thực hiện:
                </p>
                <p className="m-0 font-bold text-gray-800 mt-0.5">
                  {dayjs(selectedScan.createdAt).format("DD/MM/YYYY - HH:mm")}
                </p>
              </div>
              <div className="sm:text-right">
                <p className="m-0 text-gray-500 text-xs uppercase tracking-wider">
                  Bác sĩ phụ trách:
                </p>
                <p className="m-0 font-bold text-gray-800 mt-0.5">
                  {selectedScan.doctorName || "Bệnh nhân tự quét"}
                </p>
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-2 flex justify-center items-center overflow-hidden border border-gray-200 shadow-inner">
              <img
                src={selectedScan.imageBase64}
                alt="AI Scan Bounding Boxes"
                className="max-w-full max-h-[50vh] md:max-h-[60vh] object-contain rounded"
              />
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                onClick={() => setIsImageModalOpen(false)}
                size="large"
                className="w-full sm:w-auto"
              >
                Đóng ảnh
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DoctorScanHistory;
