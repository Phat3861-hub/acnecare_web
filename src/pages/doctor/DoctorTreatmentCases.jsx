import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCasesForDoctor } from "../../store/slice/TreatmentCaseSlice";
import { Table, Tag, Button, Input } from "antd";
import { EyeOutlined, SearchOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

const DoctorTreatmentCases = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { cases, loading } = useSelector((state) => state.treatmentCase);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    dispatch(fetchCasesForDoctor());
  }, [dispatch]);

  const filteredCases = cases.filter(
    (c) =>
      c.patientName?.toLowerCase().includes(searchText.toLowerCase()) ||
      c.id.toLowerCase().includes(searchText.toLowerCase()),
  );

  const columns = [
    {
      title: "Mã Hồ Sơ",
      dataIndex: "id",
      render: (id) => (
        <span className="font-mono text-gray-500">#{id.slice(0, 8)}</span>
      ),
    },
    {
      title: "Bệnh Nhân",
      dataIndex: "patientName",
      render: (name) => <span className="font-bold text-gray-800">{name}</span>,
    },
    {
      title: "Bắt đầu điều trị",
      dataIndex: "startDate",
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Vấn đề khám (Chief Complaint)",
      dataIndex: "chiefComplaint",
      render: (text) => (
        <div className="line-clamp-2 text-sm max-w-xs">{text || "N/A"}</div>
      ),
    },
    {
      title: "Số lần khám",
      render: (_, record) => (
        <Tag color="blue">{record.consultations?.length || 0} lần</Tag>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (status) => (
        <Tag color={status === "ACTIVE" ? "success" : "default"}>
          {status === "ACTIVE" ? "Đang điều trị" : "Đã đóng"}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      align: "center",
      render: (_, record) => (
        <Button
          type="primary"
          ghost
          icon={<EyeOutlined />}
          onClick={() => navigate(`/doctor/treatment-cases/${record.id}`)}
        >
          Chi tiết
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">
            Quản lý Ca điều trị
          </h2>
          <p className="text-gray-500 m-0">
            Danh sách toàn bộ hồ sơ bệnh án bạn đang phụ trách.
          </p>
        </div>
        <Input
          placeholder="Tìm tên bệnh nhân, mã hồ sơ..."
          prefix={<SearchOutlined />}
          className="w-72 rounded-lg"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      <Table
        columns={columns}
        dataSource={filteredCases}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        rowClassName="cursor-pointer hover:bg-gray-50"
        onRow={(record) => ({
          onClick: () => navigate(`/doctor/treatment-cases/${record.id}`),
        })}
      />
    </div>
  );
};

export default DoctorTreatmentCases;
