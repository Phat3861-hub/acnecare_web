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
        <span className="font-medium text-blue-600">
          <CalendarOutlined className="mr-2" />
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
          <Tag color={color} className="font-bold">
            {severity?.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: "Phát hiện",
      key: "details",
      render: (_, record) => (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {record.details?.map((d, i) => (
            <Tag key={i} className="text-xs m-0">
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
        <span className="text-gray-500 text-sm line-clamp-2">
          {text || "-"}
        </span>
      ),
    },
    {
      title: "Hình ảnh",
      key: "action",
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
        >
          Xem ảnh
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <Title level={3} className="mb-6 text-gray-800">
          Hồ Sơ & Lịch Sử Quét Da Bệnh Nhân
        </Title>

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={7}>
            <Card
              title={
                <Search
                  placeholder="Tìm tên hoặc SĐT..."
                  onChange={(e) => handleSearchPatient(e.target.value)}
                />
              }
              className="rounded-xl shadow-sm border border-gray-200 h-[calc(100vh-120px)] overflow-hidden flex flex-col"
              bodyStyle={{ padding: 0, flex: 1, overflowY: "auto" }}
            >
              {isLoadingPatients ? (
                <div className="flex justify-center p-10">
                  <Spin />
                </div>
              ) : (
                <List
                  dataSource={filteredPatients}
                  renderItem={(item) => (
                    <div
                      onClick={() => handleSelectPatient(item)}
                      className={`p-4 border-b cursor-pointer transition-colors hover:bg-blue-50 
                        ${
                          selectedPatient?.id === item.id
                            ? "bg-blue-100 border-blue-200"
                            : "bg-white"
                        }`}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            className="bg-blue-500"
                            icon={<UserOutlined />}
                          />
                        }
                        title={
                          <span className="font-bold text-gray-700">
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
              )}
            </Card>
          </Col>

          <Col xs={24} lg={17}>
            {selectedPatient ? (
              <Card className="rounded-xl shadow-sm border border-gray-200 min-h-[calc(100vh-120px)]">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <Title level={4} className="m-0 text-blue-700">
                      Bệnh nhân: {selectedPatient.firstName}{" "}
                      {selectedPatient.lastName}
                    </Title>
                    <Text className="text-gray-400 text-sm">
                      Email: {selectedPatient.email}
                    </Text>
                  </div>
                </div>

                <Divider className="my-4" />

                {isLoadingHistory ? (
                  <div className="flex justify-center py-20">
                    <Spin size="large" />
                  </div>
                ) : scanHistory.length > 0 ? (
                  <Table
                    dataSource={scanHistory}
                    columns={columns}
                    rowKey="id"
                    pagination={{ pageSize: 8 }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <FileSearchOutlined className="text-6xl mb-4 opacity-50" />
                    <p className="text-lg">
                      Bệnh nhân này chưa có hồ sơ quét da nào.
                    </p>
                  </div>
                )}
              </Card>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[calc(100vh-120px)] flex flex-col items-center justify-center text-gray-400">
                <UserOutlined className="text-6xl mb-4 opacity-30" />
                <Title level={4} className="text-gray-400">
                  Chọn một bệnh nhân ở cột trái để xem hồ sơ
                </Title>
              </div>
            )}
          </Col>
        </Row>
      </div>

      <Modal
        title={
          <span className="text-lg font-bold">Chi Tiết Bằng Chứng Y Khoa</span>
        }
        open={isImageModalOpen}
        onCancel={() => setIsImageModalOpen(false)}
        footer={null}
        width={700}
      >
        {selectedScan && (
          <div className="mt-4">
            <div className="flex justify-between bg-gray-50 p-4 rounded-lg mb-4 border">
              <div>
                <p className="m-0 text-gray-500 text-xs">Ngày thực hiện:</p>
                <p className="m-0 font-bold">
                  {dayjs(selectedScan.createdAt).format("DD/MM/YYYY - HH:mm")}
                </p>
              </div>
              <div>
                <p className="m-0 text-gray-500 text-xs">Bác sĩ phụ trách:</p>
                <p className="m-0 font-bold">
                  {selectedScan.doctorName || "Bệnh nhân tự quét"}
                </p>
              </div>
            </div>

            <div className="bg-black rounded-lg p-2 text-center">
              <img
                src={selectedScan.imageBase64}
                alt="AI Scan Bounding Boxes"
                className="max-w-full max-h-[60vh] object-contain rounded"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DoctorScanHistory;
