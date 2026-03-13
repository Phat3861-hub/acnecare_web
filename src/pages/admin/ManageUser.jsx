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
} from "antd";
import {
  UploadOutlined,
  UserOutlined,
  LockOutlined,
  UnlockOutlined,
  CheckOutlined,
  CloseOutlined,
  ProfileOutlined,
} from "@ant-design/icons";
import { userService } from "../../services/UserService";
import dayjs from "dayjs";

const { Option } = Select;

const ManageUser = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // States cho Modal Thêm Mới
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [form] = Form.useForm();

  // States cho Modal Xem Chi Tiết
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Lấy danh sách User
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

  // ----------------------------------------------------
  // XỬ LÝ THÊM MỚI USER
  // ----------------------------------------------------
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
        // const uploadRes = await fileService.uploadImage(formData);
        // finalAvatarUrl = uploadRes.data.url;
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

  // ----------------------------------------------------
  // XỬ LÝ THAY ĐỔI TRẠNG THÁI
  // ----------------------------------------------------
  const handleChangeStatus = async (id, newStatus) => {
    try {
      const res = await userService.changeUserStatus(id, newStatus);
      if (res.data.code === 1000) {
        let actionName = newStatus === "ACTIVE" ? "Duyệt / Mở khóa" : "Khóa";
        message.success(`Đã ${actionName.toLowerCase()} tài khoản thành công!`);
        fetchUsers();

        // Nếu đang mở Modal chi tiết mà đổi trạng thái ngoài bảng thì cập nhật lại Modal
        if (selectedUser && selectedUser.id === id) {
          handleViewDetails(id);
        }
      }
    } catch (error) {
      message.error("Thay đổi trạng thái thất bại!");
    }
  };

  // ----------------------------------------------------
  // XỬ LÝ XEM CHI TIẾT USER
  // ----------------------------------------------------
  const handleViewDetails = async (id) => {
    setLoadingDetail(true);
    setIsDetailModalVisible(true); // Mở modal ngay lập tức với spinner loading
    try {
      const res = await userService.getUserById(id);
      if (res.data.code === 1000) {
        setSelectedUser(res.data.result);
      }
    } catch (error) {
      message.error("Không thể lấy thông tin chi tiết!");
      setIsDetailModalVisible(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  // ----------------------------------------------------
  // CẤU HÌNH CỘT CHO TABLE
  // ----------------------------------------------------
  const columns = [
    {
      title: "Avatar",
      dataIndex: "avatarUrl",
      key: "avatarUrl",
      render: (url) => <Avatar src={url} icon={<UserOutlined />} />,
    },
    {
      title: "Họ và Tên",
      key: "fullName",
      render: (_, record) => (
        <span className="font-medium">
          {`${record.firstName || ""} ${record.lastName || ""}`}
        </span>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Vai trò",
      key: "roles",
      render: (_, record) => (
        <>
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
              <Tag color={color} key={role.name}>
                {role.name}
              </Tag>
            );
          })}
        </>
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
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          {/* NÚT XEM CHI TIẾT */}
          <Button
            type="link"
            className="text-blue-500 px-0 font-medium"
            icon={<ProfileOutlined />}
            onClick={() => handleViewDetails(record.id)}
          >
            Chi tiết
          </Button>

          {/* CÁC NÚT DUYỆT / TỪ CHỐI (PENDING) */}
          {record.status === "PENDING" && (
            <>
              <Popconfirm
                title="Duyệt tài khoản này?"
                onConfirm={() => handleChangeStatus(record.id, "ACTIVE")}
                okText="Duyệt"
                cancelText="Hủy"
              >
                <Button
                  type="link"
                  className="text-blue-600 px-0"
                  icon={<CheckOutlined />}
                >
                  Duyệt
                </Button>
              </Popconfirm>
              <Popconfirm
                title="Từ chối (Khóa) tài khoản này?"
                onConfirm={() => handleChangeStatus(record.id, "BLOCK")}
                okText="Từ chối"
                cancelText="Hủy"
              >
                <Button
                  type="link"
                  danger
                  className="px-0"
                  icon={<CloseOutlined />}
                >
                  Từ chối
                </Button>
              </Popconfirm>
            </>
          )}

          {/* NÚT KHÓA (ACTIVE) */}
          {record.status === "ACTIVE" && (
            <Popconfirm
              title="Khóa tài khoản này?"
              onConfirm={() => handleChangeStatus(record.id, "BLOCK")}
              okText="Đồng ý"
              cancelText="Hủy"
            >
              <Button
                type="link"
                danger
                icon={<LockOutlined />}
                className="px-0"
              >
                Khóa
              </Button>
            </Popconfirm>
          )}

          {/* NÚT MỞ KHÓA (BLOCK) */}
          {record.status === "BLOCK" && (
            <Popconfirm
              title="Mở khóa tài khoản này?"
              onConfirm={() => handleChangeStatus(record.id, "ACTIVE")}
              okText="Đồng ý"
              cancelText="Hủy"
            >
              <Button
                type="link"
                className="text-green-600 px-0"
                icon={<UnlockOutlined />}
              >
                Mở khóa
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800">Quản lý Người dùng</h2>
        <Button
          type="primary"
          className="bg-blue-600 h-10 px-5 rounded-md font-medium"
          onClick={openAddModal}
        >
          + Thêm User
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 8 }}
      />

      {/* ========================================= */}
      {/* MODAL 1: THÊM NGƯỜI DÙNG */}
      {/* ========================================= */}
      <Modal
        title={<div className="text-lg font-bold">Thêm Người dùng mới</div>}
        open={isAddModalVisible}
        onCancel={() => setIsAddModalVisible(false)}
        footer={null}
        destroyOnClose
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddSubmit}
          className="mt-6"
        >
          <Form.Item label="Ảnh đại diện" className="mb-4">
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

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="Họ"
              name="firstName"
              rules={[{ required: true, message: "Nhập họ!" }]}
            >
              <Input size="large" placeholder="VD: Nguyễn" />
            </Form.Item>
            <Form.Item
              label="Tên"
              name="lastName"
              rules={[{ required: true, message: "Nhập tên!" }]}
            >
              <Input size="large" placeholder="VD: Văn A" />
            </Form.Item>
          </div>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Nhập email!" },
              { type: "email", message: "Email không hợp lệ!" },
            ]}
          >
            <Input size="large" placeholder="email@gmail.com" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="Số điện thoại"
              name="phone"
              rules={[{ required: true, message: "Nhập SĐT!" }]}
            >
              <Input size="large" placeholder="0901234567" />
            </Form.Item>
            <Form.Item
              label="Ngày sinh"
              name="dob"
              rules={[{ required: true, message: "Chọn ngày sinh!" }]}
            >
              <DatePicker
                size="large"
                className="w-full"
                format="YYYY-MM-DD"
                placeholder="Chọn ngày"
              />
            </Form.Item>
          </div>

          <Form.Item
            label="Vai trò"
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
            label="Mật khẩu"
            name="password"
            rules={[
              { required: true, message: "Nhập mật khẩu!" },
              { min: 8, message: "Tối thiểu 8 ký tự!" },
            ]}
          >
            <Input.Password size="large" placeholder="Nhập mật khẩu" />
          </Form.Item>

          <div className="flex justify-end gap-3 mt-8 border-t pt-4">
            <Button size="large" onClick={() => setIsAddModalVisible(false)}>
              Hủy
            </Button>
            <Button
              size="large"
              type="primary"
              htmlType="submit"
              className="bg-blue-600 font-medium"
            >
              Thêm mới
            </Button>
          </div>
        </Form>
      </Modal>

      {/* ========================================= */}
      {/* MODAL 2: XEM CHI TIẾT NGƯỜI DÙNG */}
      {/* ========================================= */}
      <Modal
        title={
          <div className="text-xl font-bold border-b pb-3">Chi tiết hồ sơ</div>
        }
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={[
          <Button
            key="close"
            type="primary"
            size="large"
            onClick={() => setIsDetailModalVisible(false)}
          >
            Đóng
          </Button>,
        ]}
        width={700}
        destroyOnClose
      >
        {/* Component hiển thị thông tin đẹp mắt của Ant Design */}
        <div className="py-4">
          <Descriptions
            bordered
            column={2}
            size="middle"
            loading={loadingDetail}
          >
            <Descriptions.Item label="Ảnh đại diện" span={2}>
              <Avatar
                size={80}
                src={selectedUser?.avatarUrl}
                icon={<UserOutlined />}
              />
            </Descriptions.Item>

            <Descriptions.Item label="Họ và Tên" span={2}>
              <span className="font-semibold text-lg">
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
                <Tag color="blue" key={role.name}>
                  {role.name}
                </Tag>
              ))}
            </Descriptions.Item>

            <Descriptions.Item label="Trạng thái" span={2}>
              {selectedUser?.status === "ACTIVE" ? (
                <Badge status="success" text="Đang hoạt động" />
              ) : selectedUser?.status === "BLOCK" ? (
                <Badge status="error" text="Đã bị khóa" />
              ) : (
                <Badge status="warning" text="Đang chờ duyệt" />
              )}
            </Descriptions.Item>

            <Descriptions.Item label="Ngày tạo tài khoản">
              {selectedUser?.createdAt
                ? dayjs(selectedUser.createdAt).format("DD/MM/YYYY HH:mm")
                : "N/A"}
            </Descriptions.Item>

            <Descriptions.Item label="Lần đăng nhập cuối">
              {selectedUser?.lastLoginAt
                ? dayjs(selectedUser.lastLoginAt).format("DD/MM/YYYY HH:mm")
                : "Chưa đăng nhập"}
            </Descriptions.Item>
          </Descriptions>
        </div>
      </Modal>
    </div>
  );
};

export default ManageUser;
