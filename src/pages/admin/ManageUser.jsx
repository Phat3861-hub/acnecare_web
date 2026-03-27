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
  Descriptions,
  Badge,
  Tabs,
  Divider,
} from "antd";
import {
  UploadOutlined,
  UserOutlined,
  LockOutlined,
  UnlockOutlined,
  CheckOutlined,
  CloseOutlined,
  ProfileOutlined,
  IdcardOutlined,
} from "@ant-design/icons";
import { userService } from "../../services/UserService";
import { http } from "../../api/config"; // Bổ sung import http để gọi API Doctor Profile
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
  const [doctorProfile, setDoctorProfile] = useState(null); // Lưu thông tin chuyên môn bác sĩ
  const [loadingDetail, setLoadingDetail] = useState(false);

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
        // Tích hợp logic upload ảnh của bạn ở đây nếu cần
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

  const handleChangeStatus = async (id, newStatus) => {
    try {
      const res = await userService.changeUserStatus(id, newStatus);
      if (res.data.code === 1000) {
        let actionName =
          newStatus === "ACTIVE" ? "Duyệt / Mở khóa" : "Khóa / Từ chối";
        message.success(`Đã ${actionName.toLowerCase()} tài khoản thành công!`);
        fetchUsers();

        if (selectedUser && selectedUser.id === id) {
          handleViewDetails(selectedUser);
        }
      }
    } catch (error) {
      message.error("Thay đổi trạng thái thất bại!");
    }
  };

  // Nâng cấp hàm xem chi tiết: Tải thêm Profile nếu là Bác sĩ
  const handleViewDetails = async (record) => {
    setLoadingDetail(true);
    setIsDetailModalVisible(true);
    setSelectedUser(record);
    setDoctorProfile(null); // Reset dữ liệu cũ

    try {
      // 1. Lấy thông tin User cơ bản
      const resUser = await userService.getUserById(record.id);
      if (resUser.data.code === 1000) {
        setSelectedUser(resUser.data.result);
      }

      // 2. Nếu là Bác sĩ, gọi thêm API lấy Doctor Profile
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

          {record.status === "PENDING" && (
            <>
              <Popconfirm
                title="Duyệt tài khoản này?"
                onConfirm={() => handleChangeStatus(record.id, "ACTIVE")}
                okText="Duyệt"
                cancelText="Hủy"
              >
                <Button
                  type="text"
                  className="text-green-600 px-2 hover:bg-green-50"
                  icon={<CheckOutlined />}
                />
              </Popconfirm>
              <Popconfirm
                title="Từ chối (Khóa) tài khoản này?"
                onConfirm={() => handleChangeStatus(record.id, "BLOCK")}
                okText="Từ chối"
                cancelText="Hủy"
              >
                <Button
                  type="text"
                  danger
                  className="px-2 hover:bg-red-50"
                  icon={<CloseOutlined />}
                />
              </Popconfirm>
            </>
          )}

          {record.status === "ACTIVE" && (
            <Popconfirm
              title="Khóa tài khoản này?"
              onConfirm={() => handleChangeStatus(record.id, "BLOCK")}
              okText="Đồng ý"
              cancelText="Hủy"
            >
              <Button
                type="text"
                danger
                icon={<LockOutlined />}
                className="px-2 hover:bg-red-50"
              />
            </Popconfirm>
          )}

          {record.status === "BLOCK" && (
            <Popconfirm
              title="Mở khóa tài khoản này?"
              onConfirm={() => handleChangeStatus(record.id, "ACTIVE")}
              okText="Đồng ý"
              cancelText="Hủy"
            >
              <Button
                type="text"
                className="text-green-600 px-2 hover:bg-green-50"
                icon={<UnlockOutlined />}
              />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="p-3 sm:p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          {/* HEADER */}
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

          {/* TABS LỌC (Cuộn ngang trên mobile) */}
          <div className="overflow-x-auto custom-scrollbar mb-4 pb-1">
            <Tabs
              activeKey={activeTab}
              onChange={(key) => setActiveTab(key)}
              items={tabItems}
              style={{ marginBottom: 0 }}
            />
          </div>

          {/* BẢNG DỮ LIỆU */}
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

            {/* Responsive Grid: 1 cột mobile, 2 cột máy tính */}
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

        {/* MODAL 2: XEM CHI TIẾT TÀI KHOẢN & BÁC SĨ */}
        <Modal
          title={
            <div className="text-lg md:text-xl font-bold border-b pb-3">
              Chi tiết hồ sơ
            </div>
          }
          open={isDetailModalVisible}
          onCancel={() => setIsDetailModalVisible(false)}
          footer={[
            <Button
              key="close"
              type="primary"
              size="large"
              onClick={() => setIsDetailModalVisible(false)}
              className="w-full sm:w-auto mt-2 sm:mt-0"
            >
              Đóng cửa sổ
            </Button>,
          ]}
          width={800}
          destroyOnClose
          centered
          style={{ padding: "0 10px" }}
        >
          <div className="py-2 md:py-4">
            {/* THÔNG TIN CƠ BẢN (USER) */}
            <Descriptions
              bordered
              column={{ xs: 1, sm: 1, md: 2 }} // Responsive cột cho Description
              size="small"
              loading={loadingDetail}
              className="bg-gray-50/50"
            >
              <Descriptions.Item
                label="Ảnh đại diện"
                span={{ xs: 1, sm: 1, md: 2 }}
              >
                <Avatar
                  size={70}
                  src={selectedUser?.avatarUrl}
                  icon={<UserOutlined />}
                  className="shadow-sm"
                />
              </Descriptions.Item>

              <Descriptions.Item
                label="Họ và Tên"
                span={{ xs: 1, sm: 1, md: 2 }}
              >
                <span className="font-bold text-base md:text-lg text-gray-800">
                  {`${selectedUser?.firstName || ""} ${selectedUser?.lastName || ""}`}
                </span>
              </Descriptions.Item>

              <Descriptions.Item label="Email">
                {selectedUser?.email}
              </Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">
                {selectedUser?.phone || "Chưa cập nhật"}
              </Descriptions.Item>

              <Descriptions.Item label="Ngày sinh">
                {selectedUser?.dob
                  ? dayjs(selectedUser.dob).format("DD/MM/YYYY")
                  : "Chưa cập nhật"}
              </Descriptions.Item>
              <Descriptions.Item label="Vai trò">
                {selectedUser?.roles?.map((role) => (
                  <Tag color="blue" key={role.name} className="m-0">
                    {role.name}
                  </Tag>
                ))}
              </Descriptions.Item>

              <Descriptions.Item
                label="Trạng thái"
                span={{ xs: 1, sm: 1, md: 2 }}
              >
                {selectedUser?.status === "ACTIVE" ? (
                  <Badge
                    status="success"
                    text={<span className="font-medium">Đang hoạt động</span>}
                  />
                ) : selectedUser?.status === "BLOCK" ? (
                  <Badge
                    status="error"
                    text={
                      <span className="font-medium text-red-500">
                        Đã bị khóa / Từ chối
                      </span>
                    }
                  />
                ) : (
                  <Badge
                    status="warning"
                    text={
                      <span className="font-medium text-orange-500">
                        Đang chờ duyệt
                      </span>
                    }
                  />
                )}
              </Descriptions.Item>

              <Descriptions.Item label="Ngày tạo">
                {selectedUser?.createdAt
                  ? dayjs(selectedUser.createdAt).format("DD/MM/YYYY HH:mm")
                  : "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Đăng nhập cuối">
                {selectedUser?.lastLoginAt
                  ? dayjs(selectedUser.lastLoginAt).format("DD/MM/YYYY HH:mm")
                  : "Chưa đăng nhập"}
              </Descriptions.Item>
            </Descriptions>

            {/* THÔNG TIN CHUYÊN MÔN NẾU LÀ BÁC SĨ */}
            {selectedUser?.roles?.some((r) => r.name === "DOCTOR") && (
              <div className="mt-6">
                <Divider orientation="left" className="m-0 mb-4">
                  <span className="text-blue-700 font-bold text-base flex items-center gap-2">
                    <IdcardOutlined /> Hồ sơ chuyên môn (Bác sĩ)
                  </span>
                </Divider>

                {!loadingDetail && doctorProfile ? (
                  <Descriptions
                    bordered
                    column={{ xs: 1, sm: 1, md: 2 }}
                    size="small"
                    className="bg-blue-50/30"
                  >
                    <Descriptions.Item
                      label="Chuyên khoa"
                      span={{ xs: 1, sm: 1, md: 2 }}
                    >
                      <span className="font-semibold text-gray-800">
                        {doctorProfile.specialty || "Chưa cập nhật"}
                      </span>
                    </Descriptions.Item>

                    <Descriptions.Item
                      label="Nơi công tác"
                      span={{ xs: 1, sm: 1, md: 2 }}
                    >
                      {doctorProfile.clinicName || "Chưa cập nhật"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Kinh nghiệm">
                      {doctorProfile.yearsExperience !== null
                        ? `${doctorProfile.yearsExperience} năm`
                        : "Chưa cập nhật"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Giấy phép y tế">
                      {doctorProfile.licenseUrl ? (
                        <a
                          href={doctorProfile.licenseUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 font-medium hover:underline"
                        >
                          Xem tài liệu đính kèm
                        </a>
                      ) : (
                        "Chưa cung cấp"
                      )}
                    </Descriptions.Item>

                    <Descriptions.Item
                      label="Trạng thái duyệt hồ sơ"
                      span={{ xs: 1, sm: 1, md: 2 }}
                    >
                      <Tag
                        color={
                          doctorProfile.verificationStatus === "APPROVED"
                            ? "green"
                            : doctorProfile.verificationStatus === "REJECTED"
                              ? "red"
                              : "orange"
                        }
                      >
                        {doctorProfile.verificationStatus || "Chưa cập nhật"}
                      </Tag>
                    </Descriptions.Item>

                    {doctorProfile.bio && (
                      <Descriptions.Item
                        label="Giới thiệu bản thân"
                        span={{ xs: 1, sm: 1, md: 2 }}
                      >
                        <div className="whitespace-pre-wrap text-gray-600 italic">
                          "{doctorProfile.bio}"
                        </div>
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                ) : !loadingDetail ? (
                  <div className="bg-gray-50 border border-gray-200 border-dashed rounded-lg p-4 text-center text-gray-500 italic">
                    Bác sĩ này chưa cập nhật hồ sơ chuyên môn.
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default ManageUser;
