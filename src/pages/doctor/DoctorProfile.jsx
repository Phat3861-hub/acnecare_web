import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  Button,
  DatePicker,
  InputNumber,
  Switch,
  Card,
  Row,
  Col,
  message,
  Typography,
  Tag,
  Divider,
  Statistic,
  Alert,
  Upload,
  Avatar,
} from "antd";
import {
  UserOutlined,
  SaveOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  CloseCircleOutlined,
  StarFilled,
  UploadOutlined,
  IdcardOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import {
  fetchDoctorProfile,
  updateDoctorProfile,
} from "../../store/slice/DoctorProfileSlice";
import { userService } from "../../services/UserService";

const { Title, Text } = Typography;
const { TextArea } = Input;

const DoctorProfile = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const { profile: doctorProfile, loading: profileLoading } = useSelector(
    (state) => state.doctorProfile,
  );

  // Local states cho User Info
  const [userInfo, setUserInfo] = useState(null);
  const [userLoading, setUserLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    return `http://localhost:9090/api${url}`;
  };

  // Load cả 2 dữ liệu: User Info và Doctor Profile
  useEffect(() => {
    const fetchAllData = async () => {
      setUserLoading(true);
      try {
        const userRes = await userService.getMyInfo();
        if (userRes.data.code === 1000) {
          setUserInfo(userRes.data.result);
          setAvatarPreview(getImageUrl(userRes.data.result.avatarUrl));
        }
      } catch (error) {
        message.error("Lỗi lấy thông tin tài khoản!");
      } finally {
        setUserLoading(false);
      }
      dispatch(fetchDoctorProfile());
    };
    fetchAllData();
  }, [dispatch]);

  // Đổ dữ liệu vào Form
  useEffect(() => {
    if (doctorProfile && userInfo) {
      form.setFieldsValue({
        // User fields
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        phone: userInfo.phone,
        dob: userInfo.dob ? dayjs(userInfo.dob, "YYYY-MM-DD") : null,
        // Doctor Profile fields
        licenseUrl: doctorProfile.licenseUrl,
        specialty: doctorProfile.specialty,
        bio: doctorProfile.bio,
        clinicName: doctorProfile.clinicName,
        yearsExperience: doctorProfile.yearsExperience,
        address: doctorProfile.address, // Address nằm trong Profile
        isAcceptingAppointments: doctorProfile.acceptingAppointments,
      });
    }
  }, [doctorProfile, userInfo, form]);

  const onFinish = async (values) => {
    setIsUpdating(true);
    try {
      // 1. UPDATE USER INFO (Gửi FormData)
      const userFormData = new FormData();
      if (avatarFile) {
        userFormData.append("avatar", avatarFile);
      }
      const userData = {
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
        password: values.password, // Bắt buộc từ Backend
        roles: ["DOCTOR"], // Bắt buộc từ Backend
        dob: values.dob ? values.dob.format("YYYY-MM-DD") : null,
      };
      userFormData.append(
        "data",
        new Blob([JSON.stringify(userData)], { type: "application/json" }),
      );

      await userService.updateMyInfo(userFormData);

      // 2. UPDATE DOCTOR PROFILE
      const doctorData = {
        address: values.address,
        licenseUrl: values.licenseUrl,
        specialty: values.specialty,
        bio: values.bio,
        clinicName: values.clinicName,
        yearsExperience: values.yearsExperience,
        isAcceptingAppointments: values.isAcceptingAppointments,
      };

      await dispatch(updateDoctorProfile(doctorData)).unwrap();

      message.success("Cập nhật toàn bộ hồ sơ thành công!");
      // Reset trường mật khẩu sau khi lưu
      form.setFieldsValue({ password: "" });
    } catch (error) {
      // 🚨 FIX LỖI TẠI ĐÂY: Ép kiểu lỗi về dạng String
      const errorMsg =
        error?.response?.data?.message ||
        (typeof error === "string" ? error : error?.message) ||
        "Có lỗi xảy ra khi cập nhật!";
      message.error(errorMsg);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAvatarChange = (info) => {
    if (info.file) {
      setAvatarFile(info.file);
      setAvatarPreview(URL.createObjectURL(info.file));
    }
    return false;
  };

  const renderVerificationStatus = (status) => {
    switch (status) {
      case "ACCEPTED":
      case "APPROVED":
        return (
          <Tag
            color="success"
            icon={<CheckCircleOutlined />}
            className="text-sm px-3 py-1"
          >
            Đã Xác Minh
          </Tag>
        );
      case "PENDING":
        return (
          <Tag
            color="processing"
            icon={<SyncOutlined spin />}
            className="text-sm px-3 py-1"
          >
            Đang Chờ Duyệt
          </Tag>
        );
      case "REJECTED":
        return (
          <Tag
            color="error"
            icon={<CloseCircleOutlined />}
            className="text-sm px-3 py-1"
          >
            Từ Chối Duyệt
          </Tag>
        );
      default:
        return (
          <Tag color="default" className="text-sm px-3 py-1">
            Chưa cập nhật
          </Tag>
        );
    }
  };

  const isLoading = profileLoading || userLoading;

  return (
    <div className="p-3 sm:p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-xl md:text-2xl font-bold mb-6 text-gray-800">
          Thông Tin Cá Nhân & Chuyên Môn
        </h2>

        {/* Khối Hiển Thị Chỉ Số */}
        {doctorProfile && (
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} sm={12} md={8}>
              <Card className="rounded-xl shadow-sm border border-gray-100 h-full">
                <Statistic
                  title={
                    <span className="font-semibold text-gray-500">
                      Trạng Thái Hồ Sơ
                    </span>
                  }
                  valueRender={() =>
                    renderVerificationStatus(doctorProfile.verificationStatus)
                  }
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card className="rounded-xl shadow-sm border border-gray-100 h-full">
                <Statistic
                  title={
                    <span className="font-semibold text-gray-500">
                      Đánh Giá Trung Bình
                    </span>
                  }
                  value={doctorProfile.ratingAvg || 0}
                  suffix={
                    <StarFilled className="text-yellow-400 text-lg ml-1" />
                  }
                  precision={1}
                />
              </Card>
            </Col>
            <Col xs={24} sm={24} md={8}>
              <Card className="rounded-xl shadow-sm border border-gray-100 h-full">
                <Statistic
                  title={
                    <span className="font-semibold text-gray-500">
                      Số Lượt Đánh Giá
                    </span>
                  }
                  value={doctorProfile.ratingCount || 0}
                  suffix={<span className="text-sm text-gray-400">lượt</span>}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* Cảnh báo nếu bị từ chối */}
        {doctorProfile?.verificationStatus === "REJECTED" &&
          doctorProfile?.rejectionReason && (
            <Alert
              message="Hồ sơ của bạn bị từ chối!"
              description={`Lý do: ${doctorProfile.rejectionReason}. Vui lòng cập nhật lại thông tin.`}
              type="error"
              showIcon
              className="mb-6 rounded-lg"
            />
          )}

        {/* Form Cập Nhật */}
        <Card
          className="rounded-xl shadow-sm border border-gray-200"
          loading={isLoading}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            className="mt-2"
          >
            {/* --- PHẦN 1: THÔNG TIN TÀI KHOẢN (USER) --- */}
            <Divider orientation="left" plain>
              <span className="text-blue-600 font-bold text-base flex items-center gap-2">
                <UserOutlined /> 1. Thông tin cá nhân (Tài khoản)
              </span>
            </Divider>

            <div className="flex flex-col md:flex-row gap-8 mb-6">
              <div className="flex flex-col items-center gap-3">
                <Avatar
                  size={120}
                  src={avatarPreview}
                  icon={<UserOutlined />}
                  className="border shadow-sm object-cover"
                />
                <Upload
                  showUploadList={false}
                  beforeUpload={() => false}
                  onChange={handleAvatarChange}
                >
                  <Button icon={<UploadOutlined />} size="small">
                    Đổi Ảnh Đại Diện
                  </Button>
                </Upload>
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-6">
                <Form.Item
                  name="firstName"
                  label={<span className="font-medium">Họ</span>}
                  rules={[{ required: true, message: "Vui lòng nhập họ!" }]}
                >
                  <Input size="large" />
                </Form.Item>
                <Form.Item
                  name="lastName"
                  label={<span className="font-medium">Tên</span>}
                  rules={[{ required: true, message: "Vui lòng nhập tên!" }]}
                >
                  <Input size="large" />
                </Form.Item>
                <Form.Item
                  name="phone"
                  label={<span className="font-medium">Số điện thoại</span>}
                  rules={[{ required: true, message: "Vui lòng nhập SĐT!" }]}
                >
                  <Input size="large" />
                </Form.Item>
                <Form.Item
                  name="dob"
                  label={<span className="font-medium">Ngày sinh</span>}
                  rules={[
                    { required: true, message: "Vui lòng chọn ngày sinh!" },
                  ]}
                >
                  <DatePicker
                    className="w-full"
                    size="large"
                    format="YYYY-MM-DD"
                  />
                </Form.Item>
                <Form.Item
                  name="password"
                  label={
                    <span className="font-medium">
                      Xác nhận Mật khẩu (Bắt buộc)
                    </span>
                  }
                  rules={[
                    {
                      required: true,
                      message:
                        "Vui lòng nhập mật khẩu cũ hoặc mật khẩu mới để xác nhận lưu!",
                    },
                    { min: 8, message: "Mật khẩu tối thiểu 8 ký tự" },
                  ]}
                  tooltip="Hệ thống yêu cầu xác nhận mật khẩu để bảo mật khi thay đổi thông tin cá nhân."
                >
                  <Input.Password size="large" placeholder="Nhập mật khẩu..." />
                </Form.Item>
              </div>
            </div>

            {/* --- PHẦN 2: THÔNG TIN CHUYÊN MÔN (DOCTOR PROFILE) --- */}
            <Divider orientation="left" plain className="mt-4">
              <span className="text-blue-600 font-bold text-base flex items-center gap-2">
                <IdcardOutlined /> 2. Thông tin chuyên môn (Hồ sơ Bác sĩ)
              </span>
            </Divider>

            <Row gutter={[24, 0]}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="specialty"
                  label={<span className="font-medium">Chuyên khoa</span>}
                  rules={[{ max: 100 }]}
                >
                  <Input size="large" placeholder="Ví dụ: Da liễu thẩm mỹ..." />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="yearsExperience"
                  label={
                    <span className="font-medium">Số năm kinh nghiệm</span>
                  }
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng nhập số năm kinh nghiệm!",
                    },
                  ]}
                >
                  <InputNumber
                    size="large"
                    min={0}
                    className="w-full"
                    placeholder="Ví dụ: 5"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[24, 0]}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="clinicName"
                  label={
                    <span className="font-medium">
                      Tên Phòng khám / Bệnh viện
                    </span>
                  }
                  rules={[{ required: true }]}
                >
                  <Input size="large" placeholder="Phòng khám Da liễu ABC..." />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="address"
                  label={<span className="font-medium">Địa chỉ công tác</span>}
                >
                  <Input size="large" placeholder="Ví dụ: 123 Đường ABC..." />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="licenseUrl"
              label={
                <span className="font-medium">
                  Đường dẫn Giấy phép hành nghề (URL)
                </span>
              }
              rules={[{ required: true }, { type: "url" }]}
            >
              <Input size="large" placeholder="https://drive.google.com/..." />
            </Form.Item>

            <Form.Item
              name="bio"
              label={
                <span className="font-medium">Giới thiệu bản thân (Bio)</span>
              }
              rules={[{ max: 500 }]}
            >
              <TextArea
                rows={4}
                placeholder="Giới thiệu ngắn gọn về kinh nghiệm, chứng chỉ..."
              />
            </Form.Item>

            <Form.Item
              name="isAcceptingAppointments"
              label={
                <span className="font-medium">Trạng thái Nhận lịch khám</span>
              }
              valuePropName="checked"
            >
              <Switch checkedChildren="Đang Mở" unCheckedChildren="Tạm Đóng" />
            </Form.Item>

            <div className="flex justify-end pt-4 border-t mt-6">
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                icon={<SaveOutlined />}
                loading={isUpdating}
                className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto px-8"
              >
                Lưu Toàn Bộ Hồ Sơ
              </Button>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default DoctorProfile;
