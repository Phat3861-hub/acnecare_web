import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  message,
  Popconfirm,
  Tag,
  Upload,
  Avatar,
  Badge,
  Tabs,
  Divider,
} from "antd";
import {
  UploadOutlined,
  UserOutlined,
  CheckOutlined,
  CloseOutlined,
  ProfileOutlined,
  IdcardOutlined,
  ShopOutlined,
  LinkOutlined,
  HeartOutlined,
} from "@ant-design/icons";
import { userService } from "../../services/UserService";
import { http } from "../../api/config";
import dayjs from "dayjs";

const { Option } = Select;

const ManageUser = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("ALL");
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [form] = Form.useForm();

  // States cho phần xem chi tiết đa năng
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // States chứa Profile riêng biệt theo Role
  const [patientProfile, setPatientProfile] = useState(null);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [brandProfile, setBrandProfile] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // States cho phần Từ chối hồ sơ
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectingType, setRejectingType] = useState("");

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    return `http://localhost:9090/api${url}`;
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await userService.getAllUsers();
      if (res.data.code === 1000) {
        setUsers(res.data.result);
      }
    } catch (error) {
      message.error("Lỗi khi tải danh sách người dùng!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    if (activeTab === "ALL") return true;
    return user.status === activeTab;
  });

  const tabItems = [
    { key: "ALL", label: "Tất cả" },
    { key: "ACTIVE", label: "Đang hoạt động" },
    { key: "PENDING", label: "Chờ duyệt" },
    { key: "BLOCK", label: "Từ chối / Đã khóa" },
  ];

  const openAddModal = () => {
    setAvatarFile(null);
    form.resetFields();
    setIsAddModalVisible(true);
  };

  const handleAddSubmit = async (values) => {
    try {
      const formData = new FormData();
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }
      const userData = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
        password: values.password,
        roles: [values.role],
        dob: values.dob ? values.dob.format("YYYY-MM-DD") : null,
      };
      formData.append(
        "data",
        new Blob([JSON.stringify(userData)], { type: "application/json" }),
      );

      const res = await userService.createUser(formData);
      if (res.data.code === 1000) {
        message.success("Thêm người dùng thành công!");
        setIsAddModalVisible(false);
        fetchUsers();
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Có lỗi xảy ra khi thêm!");
    }
  };

  const handleChangeStatus = async (id, newStatus) => {
    try {
      const res = await userService.changeUserStatus(id, newStatus);
      if (res.data.code === 1000) {
        message.success(`Đã cập nhật trạng thái tài khoản thành công!`);
        fetchUsers();
        if (selectedUser && selectedUser.id === id) {
          setSelectedUser({ ...selectedUser, status: newStatus });
        }
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || "";
      if (errorMsg.includes("NOT_APPROVED")) {
        message.error(
          "Vui lòng xem chi tiết và phê duyệt hồ sơ của người này trước khi kích hoạt!",
        );
      } else {
        message.error("Thay đổi trạng thái thất bại!");
      }
    }
  };

  const handleStatusDropdownChange = (record, newStatus) => {
    if (record.status === newStatus) return;
    const statusLabels = {
      ACTIVE: "Đang hoạt động",
      PENDING: "Chờ duyệt",
      BLOCK: "Khóa tài khoản",
    };

    Modal.confirm({
      title: "Xác nhận thay đổi trạng thái",
      content: (
        <span>
          Bạn có chắc chắn muốn chuyển tài khoản này sang trạng thái:{" "}
          <strong className="text-blue-600">{statusLabels[newStatus]}</strong>?
        </span>
      ),
      okText: "Xác nhận",
      cancelText: "Hủy",
      onOk: () => handleChangeStatus(record.id, newStatus),
    });
  };

  // 🚨 CẬP NHẬT: LẤY ĐA LUỒNG THÔNG TIN PROFILE DỰA VÀO ROLE
  const handleViewDetails = async (record) => {
    setLoadingDetail(true);
    setIsDetailModalVisible(true);
    setSelectedUser(record);
    setDoctorProfile(null);
    setBrandProfile(null);
    setPatientProfile(null);

    try {
      // 1. Luôn Lấy User Info chung
      const resUser = await userService.getUserById(record.id);
      if (resUser.data.code === 1000) {
        setSelectedUser(resUser.data.result);
      }

      // 2. Phân loại Profile để gọi API
      const isPatient = record.roles?.some((r) => r.name === "PATIENT");
      const isDoctor = record.roles?.some((r) => r.name === "DOCTOR");
      const isBrand = record.roles?.some((r) => r.name === "BRAND");

      if (isPatient) {
        try {
          const resPatient = await http.get(`/patients/profile/${record.id}`);
          if (resPatient.data?.code === 1000)
            setPatientProfile(resPatient.data.result);
        } catch (error) {
          console.warn("Bệnh nhân chưa cập nhật hồ sơ y tế.");
        }
      }

      if (isDoctor) {
        try {
          const resDoc = await http.get(`/doctors/profile/${record.id}`);
          if (resDoc.data?.code === 1000) setDoctorProfile(resDoc.data.result);
        } catch (error) {
          console.warn("Bác sĩ chưa cập nhật hồ sơ.");
        }
      }

      if (isBrand) {
        try {
          const resBrand = await http.get(`/brands/profile/${record.id}`);
          if (resBrand.data?.code === 1000)
            setBrandProfile(resBrand.data.result);
        } catch (error) {
          console.warn("Brand chưa cập nhật hồ sơ.");
        }
      }
    } catch (error) {
      message.error("Không thể lấy thông tin chi tiết!");
      setIsDetailModalVisible(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleUpdateProfileStatus = async (status, reason = null) => {
    if (status === "REJECTED" && !reason?.trim()) {
      return message.warning("Vui lòng nhập lý do từ chối!");
    }

    try {
      const payload = { verificationStatus: status, rejectionReason: reason };

      if (rejectingType === "DOCTOR") {
        const res = await http.put(
          `/doctors/profile/${selectedUser.id}/status`,
          payload,
        );
        if (res.data.code === 1000) {
          message.success("Đã cập nhật trạng thái hồ sơ Bác sĩ!");
          setDoctorProfile(res.data.result);
        }
      } else if (rejectingType === "BRAND") {
        const res = await userService.changeBrandProfileStatus(
          selectedUser.id,
          payload,
        );
        if (res.data.code === 1000) {
          message.success("Đã cập nhật trạng thái hồ sơ Thương hiệu!");
          setBrandProfile(res.data.result);
        }
      }

      setIsRejectModalVisible(false);
      setRejectionReason("");

      if (status === "ACCEPTED" || status === "APPROVED") {
        if (selectedUser.status !== "ACTIVE") {
          await userService.changeUserStatus(selectedUser.id, "ACTIVE");
          message.success("Hệ thống đã tự động kích hoạt tài khoản này!");
          setSelectedUser((prev) => ({ ...prev, status: "ACTIVE" }));
          fetchUsers();
        }
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Lỗi khi cập nhật hồ sơ!");
    }
  };

  const openRejectModal = (type) => {
    setRejectingType(type);
    setIsRejectModalVisible(true);
  };

  const handleApprove = (type) => {
    setRejectingType(type);
    setTimeout(() => {
      handleUpdateProfileStatus("ACCEPTED");
    }, 0);
  };

  const columns = [
    {
      title: "Avatar",
      dataIndex: "avatarUrl",
      key: "avatarUrl",
      render: (url) => (
        <Avatar
          src={getImageUrl(url)}
          icon={<UserOutlined />}
          className="shadow-sm border border-gray-100 object-cover"
        />
      ),
    },
    {
      title: "Họ và Tên",
      key: "fullName",
      render: (_, record) => (
        <span className="font-medium text-gray-800 whitespace-nowrap">
          {`${record.firstName || ""} ${record.lastName || ""}`}
        </span>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (email) => <span className="text-gray-600">{email}</span>,
    },
    {
      title: "Vai trò",
      key: "roles",
      render: (_, record) => (
        <div className="flex gap-1 flex-wrap whitespace-nowrap">
          {record.roles?.map((role) => {
            let color =
              role.name === "ADMIN"
                ? "red"
                : role.name === "DOCTOR"
                  ? "blue"
                  : role.name === "BRAND"
                    ? "purple"
                    : "green";
            return (
              <Tag color={color} key={role.name} className="m-0">
                {role.name}
              </Tag>
            );
          })}
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        let color = "default";
        let text = status;
        if (status === "ACTIVE") {
          color = "success";
          text = "Đang hoạt động";
        } else if (status === "BLOCK") {
          color = "error";
          text = "Đã khóa";
        } else if (status === "PENDING") {
          color = "warning";
          text = "Chờ duyệt";
        }
        return (
          <Tag color={color} className="whitespace-nowrap">
            {text}
          </Tag>
        );
      },
    },
    {
      title: "Hành động",
      key: "action",
      align: "center",
      render: (_, record) => (
        <Space size="small" className="whitespace-nowrap">
          <Button
            type="link"
            className="text-blue-600 px-2 font-medium bg-blue-50 hover:bg-blue-100 rounded"
            icon={<ProfileOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            Chi tiết
          </Button>

          <Select
            value={record.status}
            style={{ width: 140 }}
            onChange={(val) => handleStatusDropdownChange(record, val)}
            className="font-medium text-left"
          >
            <Option value="ACTIVE">
              <span className="text-green-600">Hoạt động</span>
            </Option>
            <Option value="PENDING">
              <span className="text-orange-500">Chờ duyệt</span>
            </Option>
            <Option value="BLOCK">
              <span className="text-red-500">Khóa</span>
            </Option>
          </Select>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-3 sm:p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b pb-4 gap-4">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 m-0">
              Quản lý Người dùng
            </h2>
            <Button
              type="primary"
              className="bg-blue-600 h-10 px-5 rounded-lg font-medium shadow-md"
              onClick={openAddModal}
            >
              + Thêm User
            </Button>
          </div>

          <div className="overflow-x-auto custom-scrollbar mb-4 pb-1">
            <Tabs
              activeKey={activeTab}
              onChange={(key) => setActiveTab(key)}
              items={tabItems}
              style={{ marginBottom: 0 }}
            />
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <Table
              columns={columns}
              dataSource={filteredUsers}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 8,
                showTotal: (total) => `Tổng cộng ${total} tài khoản`,
              }}
              scroll={{ x: "max-content" }}
              rowClassName="hover:bg-gray-50"
            />
          </div>
        </div>

        {/* MODAL 1: THÊM NGƯỜI DÙNG */}
        <Modal
          title={
            <h3 className="text-xl font-bold text-gray-800 m-0">
              Thêm Người Dùng Mới
            </h3>
          }
          open={isAddModalVisible}
          onCancel={() => setIsAddModalVisible(false)}
          onOk={() => form.submit()}
          okText="Tạo tài khoản"
          cancelText="Hủy bỏ"
          centered
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleAddSubmit}
            className="mt-4"
          >
            <Form.Item label="Ảnh đại diện">
              <Upload
                listType="picture"
                maxCount={1}
                beforeUpload={(file) => {
                  setAvatarFile(file);
                  return false;
                }}
                onRemove={() => setAvatarFile(null)}
              >
                <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
              </Upload>
            </Form.Item>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                name="firstName"
                label="Họ"
                rules={[{ required: true, message: "Vui lòng nhập họ" }]}
              >
                <Input placeholder="Nhập họ..." />
              </Form.Item>
              <Form.Item
                name="lastName"
                label="Tên"
                rules={[{ required: true, message: "Vui lòng nhập tên" }]}
              >
                <Input placeholder="Nhập tên..." />
              </Form.Item>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: "Vui lòng nhập email" },
                  { type: "email", message: "Email không hợp lệ" },
                ]}
              >
                <Input placeholder="email@example.com" />
              </Form.Item>
              <Form.Item
                name="phone"
                label="Số điện thoại"
                rules={[
                  { required: true, message: "Vui lòng nhập số điện thoại" },
                  { pattern: /^[0-9]{10,11}$/, message: "SĐT không hợp lệ" },
                ]}
              >
                <Input placeholder="0901234567" />
              </Form.Item>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                name="dob"
                label="Ngày sinh"
                rules={[{ required: true, message: "Vui lòng chọn ngày sinh" }]}
              >
                <DatePicker
                  className="w-full"
                  format="YYYY-MM-DD"
                  placeholder="Chọn ngày"
                />
              </Form.Item>
              <Form.Item
                name="role"
                label="Vai trò"
                rules={[{ required: true, message: "Vui lòng chọn vai trò" }]}
              >
                <Select placeholder="Chọn vai trò">
                  <Option value="PATIENT">Người dùng</Option>
                  <Option value="DOCTOR">Bác sĩ</Option>
                  <Option value="BRAND">Thương hiệu</Option>
                  <Option value="ADMIN">Quản trị viên</Option>
                </Select>
              </Form.Item>
            </div>

            <Form.Item
              name="password"
              label="Mật khẩu khởi tạo"
              rules={[
                { required: true, message: "Vui lòng nhập mật khẩu" },
                { min: 8, message: "Mật khẩu tối thiểu 8 ký tự" },
              ]}
            >
              <Input.Password placeholder="Nhập mật khẩu..." />
            </Form.Item>
          </Form>
        </Modal>

        {/* MODAL 2: GIAO DIỆN XEM CHI TIẾT */}
        <Modal
          open={isDetailModalVisible}
          onCancel={() => setIsDetailModalVisible(false)}
          footer={null}
          width={800}
          destroyOnClose
          centered
          closeIcon={
            <CloseOutlined className="text-xl text-gray-500 hover:text-red-500 transition-colors" />
          }
          className="custom-detail-modal"
        >
          <div className="pt-2">
            {loadingDetail ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              selectedUser && (
                <>
                  {/* HEADER USER INFO MẶC ĐỊNH */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 bg-gradient-to-r from-blue-50 to-white p-6 rounded-2xl border border-blue-100 mb-6">
                    <Avatar
                      size={80}
                      src={getImageUrl(selectedUser.avatarUrl)}
                      icon={<UserOutlined />}
                      className="shadow-md border-2 border-white flex-shrink-0 object-cover"
                    />
                    <div className="flex-1 text-center sm:text-left">
                      <h2 className="text-2xl font-bold text-gray-800 m-0 mb-1">{`${selectedUser.firstName || ""} ${selectedUser.lastName || ""}`}</h2>
                      <p className="text-gray-500 m-0 mb-3 text-sm">
                        {selectedUser.email}
                      </p>
                      <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                        {selectedUser.roles?.map((role) => (
                          <Tag
                            color="blue"
                            key={role.name}
                            className="m-0 font-medium px-3 py-0.5 rounded-full"
                          >
                            {role.name}
                          </Tag>
                        ))}
                        <Tag
                          color={
                            selectedUser.status === "ACTIVE"
                              ? "success"
                              : selectedUser.status === "BLOCK"
                                ? "error"
                                : "warning"
                          }
                          className="m-0 font-medium px-3 py-0.5 rounded-full"
                        >
                          {selectedUser.status === "ACTIVE"
                            ? "Đang hoạt động"
                            : selectedUser.status === "BLOCK"
                              ? "Đã bị khóa"
                              : "Chờ duyệt"}
                        </Tag>
                      </div>
                    </div>
                  </div>

                  {/* THÔNG TIN LIÊN HỆ */}
                  <h3 className="text-lg font-bold text-gray-800 mb-4 px-1">
                    Thông tin liên hệ
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 px-1">
                    <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-100">
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                        Số điện thoại
                      </div>
                      <div className="font-semibold text-gray-800">
                        {selectedUser.phone || "Chưa cập nhật"}
                      </div>
                    </div>
                    <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-100">
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                        Ngày sinh
                      </div>
                      <div className="font-semibold text-gray-800">
                        {selectedUser.dob
                          ? dayjs(selectedUser.dob).format("DD/MM/YYYY")
                          : "Chưa cập nhật"}
                      </div>
                    </div>
                    <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-100">
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                        Ngày tạo tài khoản
                      </div>
                      <div className="font-semibold text-gray-800">
                        {selectedUser.createdAt
                          ? dayjs(selectedUser.createdAt).format(
                              "DD/MM/YYYY HH:mm",
                            )
                          : "N/A"}
                      </div>
                    </div>
                    <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-100">
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                        Đăng nhập lần cuối
                      </div>
                      <div className="font-semibold text-gray-800">
                        {selectedUser.lastLoginAt
                          ? dayjs(selectedUser.lastLoginAt).format(
                              "DD/MM/YYYY HH:mm",
                            )
                          : "Chưa đăng nhập"}
                      </div>
                    </div>
                  </div>

                  {/* 🚨🚨🚨 PATIENT PROFILE SECTION 🚨🚨🚨 */}
                  {selectedUser.roles?.some((r) => r.name === "PATIENT") && (
                    <div>
                      <Divider className="my-6 border-gray-200" />
                      <h3 className="text-lg font-bold text-green-700 mb-4 px-1 flex items-center gap-2">
                        <HeartOutlined /> Hồ sơ Y tế Cá nhân
                      </h3>
                      {patientProfile ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-1">
                          <div className="bg-green-50/50 p-4 rounded-xl border border-green-100">
                            <div className="text-xs text-green-600 uppercase tracking-wider mb-1">
                              Giới tính
                            </div>
                            <div className="font-semibold text-gray-800">
                              {patientProfile.gender ? "Nam" : "Nữ"}
                            </div>
                          </div>
                          <div className="bg-green-50/50 p-4 rounded-xl border border-green-100">
                            <div className="text-xs text-green-600 uppercase tracking-wider mb-1">
                              Loại da
                            </div>
                            <div className="font-semibold text-gray-800">
                              {patientProfile.skinType || "Chưa xác định"}
                            </div>
                          </div>
                          <div className="bg-green-50/50 p-4 rounded-xl border border-green-100">
                            <div className="text-xs text-green-600 uppercase tracking-wider mb-1">
                              Chiều cao - Cân nặng
                            </div>
                            <div className="font-semibold text-gray-800">
                              {patientProfile.height
                                ? `${patientProfile.height} cm`
                                : "N/A"}{" "}
                              -{" "}
                              {patientProfile.weight
                                ? `${patientProfile.weight} kg`
                                : "N/A"}
                            </div>
                          </div>
                          <div className="bg-green-50/50 p-4 rounded-xl border border-green-100">
                            <div className="text-xs text-green-600 uppercase tracking-wider mb-1">
                              Tiền sử dị ứng
                            </div>
                            <div className="font-semibold text-gray-800 line-clamp-1">
                              {patientProfile.allergies || "Không có"}
                            </div>
                          </div>
                          <div className="bg-green-50/50 p-4 rounded-xl border border-green-100 md:col-span-2">
                            <div className="text-xs text-green-600 uppercase tracking-wider mb-1">
                              Địa chỉ giao hàng
                            </div>
                            <div className="font-semibold text-gray-800">
                              {patientProfile.address || "Chưa cập nhật"}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 border-2 border-dashed rounded-xl p-8 text-center text-gray-500 mt-4">
                          <p>Bệnh nhân này chưa cập nhật hồ sơ y tế.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 🚨🚨🚨 DOCTOR PROFILE SECTION 🚨🚨🚨 */}
                  {selectedUser.roles?.some((r) => r.name === "DOCTOR") && (
                    <div>
                      <Divider className="my-6 border-gray-200" />
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3 px-1">
                        <h3 className="text-lg font-bold text-blue-700 m-0 flex items-center gap-2">
                          <IdcardOutlined /> Hồ sơ chuyên môn (Bác sĩ)
                        </h3>
                        {doctorProfile && (
                          <Tag
                            color={
                              doctorProfile.verificationStatus === "ACCEPTED"
                                ? "success"
                                : doctorProfile.verificationStatus ===
                                    "REJECTED"
                                  ? "error"
                                  : "warning"
                            }
                            className="m-0 text-sm py-1 px-3 rounded-full font-medium"
                          >
                            {doctorProfile.verificationStatus === "ACCEPTED"
                              ? "Đã duyệt (ACCEPTED)"
                              : doctorProfile.verificationStatus === "REJECTED"
                                ? "Bị từ chối (REJECTED)"
                                : "Chờ duyệt (PENDING)"}
                          </Tag>
                        )}
                      </div>

                      {doctorProfile ? (
                        <div className="space-y-4 px-1">
                          {doctorProfile.verificationStatus === "REJECTED" &&
                            doctorProfile.rejectionReason && (
                              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg mb-4">
                                <p className="text-red-700 font-bold text-sm m-0 mb-1">
                                  Lý do từ chối hồ sơ:
                                </p>
                                <p className="text-red-600 text-sm m-0 italic">
                                  {doctorProfile.rejectionReason}
                                </p>
                              </div>
                            )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                              <div className="text-xs text-blue-500 uppercase tracking-wider mb-1">
                                Chuyên khoa
                              </div>
                              <div className="font-semibold text-gray-800">
                                {doctorProfile.specialty || "Chưa cập nhật"}
                              </div>
                            </div>
                            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                              <div className="text-xs text-blue-500 uppercase tracking-wider mb-1">
                                Kinh nghiệm
                              </div>
                              <div className="font-semibold text-gray-800">
                                {doctorProfile.yearsExperience
                                  ? `${doctorProfile.yearsExperience} năm`
                                  : "Chưa cập nhật"}
                              </div>
                            </div>
                            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 md:col-span-2">
                              <div className="text-xs text-blue-500 uppercase tracking-wider mb-1">
                                Nơi công tác
                              </div>
                              <div className="font-semibold text-gray-800">
                                {doctorProfile.clinicName || "Chưa cập nhật"}
                              </div>
                            </div>
                            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 md:col-span-2">
                              <div className="text-xs text-blue-500 uppercase tracking-wider mb-1">
                                Giấy phép hành nghề
                              </div>
                              <div className="font-semibold text-blue-600">
                                {doctorProfile.licenseUrl ? (
                                  <a
                                    href={getImageUrl(doctorProfile.licenseUrl)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1"
                                  >
                                    <LinkOutlined /> Xem giấy phép
                                  </a>
                                ) : (
                                  "Chưa cung cấp"
                                )}
                              </div>
                            </div>
                          </div>

                          {/* THAO TÁC DUYỆT (DOCTOR) */}
                          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-gray-600 font-medium text-sm">
                              Thao tác xét duyệt hồ sơ chuyên môn:
                            </div>
                            <div className="flex flex-wrap justify-center gap-3">
                              {doctorProfile.verificationStatus !==
                                "ACCEPTED" && (
                                <Popconfirm
                                  title="Xác nhận duyệt hồ sơ này?"
                                  onConfirm={() => handleApprove("DOCTOR")}
                                  okText="Đồng ý duyệt"
                                  cancelText="Hủy"
                                >
                                  <Button
                                    type="primary"
                                    className="bg-green-600 font-medium border-none hover:bg-green-500"
                                  >
                                    <CheckOutlined /> Phê duyệt hồ sơ
                                  </Button>
                                </Popconfirm>
                              )}
                              {doctorProfile.verificationStatus !==
                                "REJECTED" && (
                                <Button
                                  danger
                                  className="font-medium"
                                  onClick={() => openRejectModal("DOCTOR")}
                                >
                                  <CloseOutlined /> Từ chối hồ sơ
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 border-2 border-dashed rounded-xl p-8 text-center text-gray-500 mt-4">
                          <p>Chưa cập nhật hồ sơ chuyên môn.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 🚨🚨🚨 BRAND PROFILE SECTION 🚨🚨🚨 */}
                  {selectedUser.roles?.some((r) => r.name === "BRAND") && (
                    <div>
                      <Divider className="my-6 border-gray-200" />
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3 px-1">
                        <h3 className="text-lg font-bold text-purple-700 m-0 flex items-center gap-2">
                          <ShopOutlined /> Hồ sơ Thương hiệu (Brand)
                        </h3>
                        {brandProfile && (
                          <Tag
                            color={
                              brandProfile.verificationStatus === "ACCEPTED" ||
                              brandProfile.verificationStatus === "APPROVED"
                                ? "success"
                                : brandProfile.verificationStatus === "REJECTED"
                                  ? "error"
                                  : "warning"
                            }
                            className="m-0 text-sm py-1 px-3 rounded-full font-medium"
                          >
                            {brandProfile.verificationStatus === "ACCEPTED" ||
                            brandProfile.verificationStatus === "APPROVED"
                              ? "Đã duyệt"
                              : brandProfile.verificationStatus === "REJECTED"
                                ? "Bị từ chối"
                                : "Chờ duyệt (PENDING)"}
                          </Tag>
                        )}
                      </div>

                      {brandProfile ? (
                        <div className="space-y-4 px-1">
                          {brandProfile.verificationStatus === "REJECTED" &&
                            brandProfile.rejectionReason && (
                              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg mb-4">
                                <p className="text-red-700 font-bold text-sm m-0 mb-1">
                                  Lý do từ chối hồ sơ:
                                </p>
                                <p className="text-red-600 text-sm m-0 italic">
                                  {brandProfile.rejectionReason}
                                </p>
                              </div>
                            )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100 flex items-center gap-4">
                              <Avatar
                                size={50}
                                src={getImageUrl(brandProfile.logoUrl)}
                                shape="square"
                                className="border shadow-sm bg-white object-cover"
                              />
                              <div>
                                <div className="text-xs text-purple-500 uppercase tracking-wider mb-1">
                                  Tên Thương Hiệu
                                </div>
                                <div className="font-semibold text-gray-800">
                                  {brandProfile.brandName || "Chưa cập nhật"}
                                </div>
                              </div>
                            </div>

                            <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100">
                              <div className="text-xs text-purple-500 uppercase tracking-wider mb-1">
                                Website
                              </div>
                              <div className="font-semibold text-gray-800 line-clamp-1">
                                {brandProfile.website ? (
                                  <a
                                    href={brandProfile.website}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-600 hover:underline flex items-center gap-1"
                                  >
                                    <LinkOutlined /> {brandProfile.website}
                                  </a>
                                ) : (
                                  "Chưa cung cấp"
                                )}
                              </div>
                            </div>
                          </div>

                          {/* THAO TÁC DUYỆT (BRAND) */}
                          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-gray-600 font-medium text-sm">
                              Thao tác xét duyệt hồ sơ thương hiệu:
                            </div>
                            <div className="flex flex-wrap justify-center gap-3">
                              {brandProfile.verificationStatus !== "ACCEPTED" &&
                                brandProfile.verificationStatus !==
                                  "APPROVED" && (
                                  <Popconfirm
                                    title="Xác nhận duyệt hồ sơ nhãn hàng này?"
                                    onConfirm={() => handleApprove("BRAND")}
                                    okText="Đồng ý"
                                    cancelText="Hủy"
                                  >
                                    <Button
                                      type="primary"
                                      className="bg-green-600 font-medium border-none hover:bg-green-500"
                                    >
                                      <CheckOutlined /> Phê duyệt hồ sơ
                                    </Button>
                                  </Popconfirm>
                                )}
                              {brandProfile.verificationStatus !==
                                "REJECTED" && (
                                <Button
                                  danger
                                  className="font-medium"
                                  onClick={() => openRejectModal("BRAND")}
                                >
                                  <CloseOutlined /> Từ chối hồ sơ
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 border-2 border-dashed rounded-xl p-8 text-center text-gray-500 mt-4">
                          <p>Thương hiệu này chưa cập nhật hồ sơ.</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )
            )}
          </div>
        </Modal>

        {/* MODAL 3: NHẬP LÝ DO TỪ CHỐI HỒ SƠ */}
        <Modal
          title={
            <span className="text-red-500 font-bold text-lg">
              Từ chối hồ sơ (
              {rejectingType === "BRAND" ? "Thương hiệu" : "Bác sĩ"})
            </span>
          }
          open={isRejectModalVisible}
          onOk={() => handleUpdateProfileStatus("REJECTED", rejectionReason)}
          onCancel={() => {
            setIsRejectModalVisible(false);
            setRejectionReason("");
          }}
          okText="Xác nhận Từ chối"
          okButtonProps={{ danger: true, size: "large" }}
          cancelButtonProps={{ size: "large" }}
          centered
        >
          <div className="py-4">
            <p className="mb-3 font-medium text-gray-700">
              Vui lòng nhập lý do từ chối để họ biết và cập nhật lại:
            </p>
            <Input.TextArea
              rows={4}
              size="large"
              placeholder={
                rejectingType === "BRAND"
                  ? "Ví dụ: Link logo bị hỏng, website không tồn tại..."
                  : "Ví dụ: Giấy phép bị mờ..."
              }
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="rounded-lg"
            />
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default ManageUser;
