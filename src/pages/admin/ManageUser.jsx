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
  LockOutlined,
  UnlockOutlined,
  LinkOutlined,
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

  // States cho phần xem chi tiết
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // States cho phần Từ chối hồ sơ Bác sĩ
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

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
      let finalAvatarUrl = `https://ui-avatars.com/api/?name=${values.firstName}+${values.lastName}`;

      if (avatarFile) {
        const formData = new FormData();
        formData.append("file", avatarFile);
        // Upload logic
      }

      const payload = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
        password: values.password,
        roles: [values.role],
        dob: values.dob ? values.dob.format("YYYY-MM-DD") : null,
        avatarUrl: finalAvatarUrl,
      };

      const res = await userService.createUser(payload);
      if (res.data.code === 1000) {
        message.success("Thêm người dùng thành công!");
        setIsAddModalVisible(false);
        fetchUsers();
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Có lỗi xảy ra khi thêm!");
    }
  };

  // Thay đổi trạng thái Tài khoản User
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
      message.error(
        error.response?.data?.message || "Thay đổi trạng thái thất bại!",
      );
    }
  };

  // Hàm handle khi Admin chọn trạng thái mới trên dropdown
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

  // Xem chi tiết
  const handleViewDetails = async (record) => {
    setLoadingDetail(true);
    setIsDetailModalVisible(true);
    setSelectedUser(record);
    setDoctorProfile(null);

    try {
      const resUser = await userService.getUserById(record.id);
      if (resUser.data.code === 1000) {
        setSelectedUser(resUser.data.result);
      }

      const isDoctor = record.roles?.some((r) => r.name === "DOCTOR");
      if (isDoctor) {
        try {
          const resDoc = await http.get(`/doctors/profile/${record.id}`);
          if (resDoc.data?.code === 1000) {
            setDoctorProfile(resDoc.data.result);
          }
        } catch (docError) {
          console.warn("Bác sĩ này chưa cập nhật hồ sơ chuyên môn.");
        }
      }
    } catch (error) {
      message.error("Không thể lấy thông tin chi tiết!");
      setIsDetailModalVisible(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Xử lý thay đổi trạng thái HỒ SƠ BÁC SĨ
  const handleUpdateDoctorProfileStatus = async (status, reason = null) => {
    if (status === "REJECTED" && !reason?.trim()) {
      return message.warning("Vui lòng nhập lý do từ chối!");
    }

    try {
      const payload = {
        verificationStatus: status,
        rejectionReason: reason,
      };

      const res = await userService.changeDoctorProfileStatus(
        selectedUser.id,
        payload,
      );
      if (res.data.code === 1000) {
        message.success("Đã cập nhật trạng thái hồ sơ chuyên môn!");
        setDoctorProfile(res.data.result);
        setIsRejectModalVisible(false);
        setRejectionReason("");
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Lỗi khi cập nhật hồ sơ!");
    }
  };

  const columns = [
    {
      title: "Avatar",
      dataIndex: "avatarUrl",
      key: "avatarUrl",
      render: (url) => (
        <Avatar
          src={url}
          icon={<UserOutlined />}
          className="shadow-sm border border-gray-100"
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

          {/* SELECT ĐỂ ĐỔI TRẠNG THÁI */}
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
              className="bg-blue-600 h-10 px-5 rounded-lg font-medium w-full sm:w-auto shadow-md"
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
            <div className="text-lg md:text-xl font-bold">
              Thêm Người dùng mới
            </div>
          }
          open={isAddModalVisible}
          onCancel={() => setIsAddModalVisible(false)}
          footer={null}
          destroyOnClose
          width={600}
          centered
          style={{ padding: "0 10px" }}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleAddSubmit}
            className="mt-4 md:mt-6"
          >
            <Form.Item
              label={<span className="font-medium">Ảnh đại diện</span>}
              className="mb-4"
            >
              <Upload
                listType="picture"
                maxCount={1}
                beforeUpload={(file) => {
                  setAvatarFile(file);
                  return false;
                }}
                onRemove={() => setAvatarFile(null)}
              >
                <Button icon={<UploadOutlined />}>Tải ảnh lên</Button>
              </Upload>
            </Form.Item>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0">
              <Form.Item
                label={<span className="font-medium">Họ</span>}
                name="firstName"
                rules={[{ required: true, message: "Nhập họ!" }]}
              >
                <Input size="large" placeholder="VD: Nguyễn" />
              </Form.Item>
              <Form.Item
                label={<span className="font-medium">Tên</span>}
                name="lastName"
                rules={[{ required: true, message: "Nhập tên!" }]}
              >
                <Input size="large" placeholder="VD: Văn A" />
              </Form.Item>
            </div>
            <Form.Item
              label={<span className="font-medium">Email</span>}
              name="email"
              rules={[
                { required: true, message: "Nhập email!" },
                { type: "email", message: "Email không hợp lệ!" },
              ]}
            >
              <Input size="large" placeholder="email@gmail.com" />
            </Form.Item>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0">
              <Form.Item
                label={<span className="font-medium">Số điện thoại</span>}
                name="phone"
                rules={[{ required: true, message: "Nhập SĐT!" }]}
              >
                <Input size="large" placeholder="0901234567" />
              </Form.Item>
              <Form.Item
                label={<span className="font-medium">Ngày sinh</span>}
                name="dob"
                rules={[{ required: true, message: "Chọn ngày sinh!" }]}
              >
                <DatePicker
                  size="large"
                  className="w-full"
                  format="DD/MM/YYYY"
                  placeholder="Chọn ngày"
                />
              </Form.Item>
            </div>
            <Form.Item
              label={<span className="font-medium">Vai trò</span>}
              name="role"
              rules={[{ required: true, message: "Chọn 1 vai trò!" }]}
            >
              <Select size="large" placeholder="Chọn vai trò">
                <Option value="ADMIN">Admin</Option>
                <Option value="DOCTOR">Bác sĩ</Option>
                <Option value="PATIENT">Người dùng</Option>
                <Option value="BRAND">Thương hiệu</Option>
              </Select>
            </Form.Item>
            <Form.Item
              label={<span className="font-medium">Mật khẩu</span>}
              name="password"
              rules={[
                { required: true, message: "Nhập mật khẩu!" },
                { min: 8, message: "Tối thiểu 8 ký tự!" },
              ]}
            >
              <Input.Password size="large" placeholder="Nhập mật khẩu" />
            </Form.Item>
            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 border-t pt-4">
              <Button
                size="large"
                onClick={() => setIsAddModalVisible(false)}
                className="w-full sm:w-auto"
              >
                Hủy
              </Button>
              <Button
                size="large"
                type="primary"
                htmlType="submit"
                className="bg-blue-600 font-medium w-full sm:w-auto px-8"
              >
                Thêm mới
              </Button>
            </div>
          </Form>
        </Modal>

        {/* MODAL 2: GIAO DIỆN XEM CHI TIẾT MỚI */}
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
          style={{ padding: "0 10px" }}
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
                  {/* 1. HEADER USER INFO */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 bg-gradient-to-r from-blue-50 to-white p-6 rounded-2xl border border-blue-100 mb-6">
                    <Avatar
                      size={80}
                      src={selectedUser.avatarUrl}
                      icon={<UserOutlined />}
                      className="shadow-md border-2 border-white flex-shrink-0"
                    />
                    <div className="flex-1 text-center sm:text-left">
                      <h2 className="text-2xl font-bold text-gray-800 m-0 mb-1">
                        {`${selectedUser.firstName || ""} ${selectedUser.lastName || ""}`}
                      </h2>
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
                        {selectedUser.status === "ACTIVE" ? (
                          <Tag
                            color="success"
                            className="m-0 font-medium px-3 py-0.5 rounded-full"
                          >
                            Đang hoạt động
                          </Tag>
                        ) : selectedUser.status === "BLOCK" ? (
                          <Tag
                            color="error"
                            className="m-0 font-medium px-3 py-0.5 rounded-full"
                          >
                            Đã bị khóa
                          </Tag>
                        ) : (
                          <Tag
                            color="warning"
                            className="m-0 font-medium px-3 py-0.5 rounded-full"
                          >
                            Chờ duyệt
                          </Tag>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 2. CONTACT INFO GRID */}
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

                  {/* 3. DOCTOR PROFILE SECTION */}
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
                              ? "Hồ sơ đã duyệt (ACCEPTED)"
                              : doctorProfile.verificationStatus === "REJECTED"
                                ? "Hồ sơ bị từ chối (REJECTED)"
                                : "Hồ sơ chờ duyệt (PENDING)"}
                          </Tag>
                        )}
                      </div>

                      {doctorProfile ? (
                        <div className="space-y-4 px-1">
                          {/* Status Alert if Rejected */}
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

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                {doctorProfile.yearsExperience !== null
                                  ? `${doctorProfile.yearsExperience} năm`
                                  : "Chưa cập nhật"}
                              </div>
                            </div>
                            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                              <div className="text-xs text-blue-500 uppercase tracking-wider mb-1">
                                Nơi công tác
                              </div>
                              <div className="font-semibold text-gray-800">
                                {doctorProfile.clinicName || "Chưa cập nhật"}
                              </div>
                            </div>
                          </div>

                          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                            <div className="text-xs text-blue-500 uppercase tracking-wider mb-1">
                              Giấy phép y tế (URL)
                            </div>
                            {doctorProfile.licenseUrl ? (
                              <a
                                href={doctorProfile.licenseUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 font-medium hover:text-blue-800 hover:underline break-all flex items-start gap-1.5"
                              >
                                <LinkOutlined className="mt-1 flex-shrink-0" />
                                <span>{doctorProfile.licenseUrl}</span>
                              </a>
                            ) : (
                              <span className="text-gray-500 italic">
                                Chưa cung cấp
                              </span>
                            )}
                          </div>

                          {doctorProfile.bio && (
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mt-4 relative">
                              <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                                Giới thiệu bản thân
                              </div>
                              <p className="text-gray-600 italic m-0 text-sm leading-relaxed">
                                "{doctorProfile.bio}"
                              </p>
                            </div>
                          )}

                          {/* ADMIN ACTIONS FOR DOCTOR PROFILE */}
                          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-gray-600 font-medium text-sm text-center sm:text-left">
                              Thao tác xét duyệt hồ sơ chuyên môn:
                            </div>
                            <div className="flex flex-wrap justify-center gap-3">
                              {doctorProfile.verificationStatus !==
                                "ACCEPTED" && (
                                <Popconfirm
                                  title="Xác nhận duyệt hồ sơ y tế này?"
                                  onConfirm={() =>
                                    handleUpdateDoctorProfileStatus("ACCEPTED")
                                  }
                                  okText="Đồng ý duyệt"
                                  cancelText="Hủy"
                                >
                                  <Button
                                    type="primary"
                                    className="bg-green-600 font-medium border-none shadow-sm hover:bg-green-500"
                                  >
                                    <CheckOutlined /> Phê duyệt hồ sơ
                                  </Button>
                                </Popconfirm>
                              )}

                              {doctorProfile.verificationStatus !==
                                "REJECTED" && (
                                <Button
                                  danger
                                  className="font-medium shadow-sm"
                                  onClick={() => setIsRejectModalVisible(true)}
                                >
                                  <CloseOutlined /> Từ chối hồ sơ
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 border-2 border-gray-200 border-dashed rounded-xl p-8 text-center text-gray-500 mt-4">
                          <IdcardOutlined className="text-4xl text-gray-300 mb-3" />
                          <p className="m-0 text-base">
                            Bác sĩ này chưa cập nhật hồ sơ chuyên môn.
                          </p>
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
              Từ chối hồ sơ chuyên môn
            </span>
          }
          open={isRejectModalVisible}
          onOk={() =>
            handleUpdateDoctorProfileStatus("REJECTED", rejectionReason)
          }
          onCancel={() => {
            setIsRejectModalVisible(false);
            setRejectionReason("");
          }}
          okText="Xác nhận Từ chối"
          okButtonProps={{ danger: true, size: "large" }}
          cancelButtonProps={{ size: "large" }}
          cancelText="Hủy"
          centered
        >
          <div className="py-4">
            <p className="mb-3 font-medium text-gray-700">
              Vui lòng nhập lý do từ chối để bác sĩ biết và cập nhật lại:
            </p>
            <Input.TextArea
              rows={4}
              size="large"
              placeholder="Ví dụ: Giấy phép hành nghề bị mờ, đường link không truy cập được..."
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
