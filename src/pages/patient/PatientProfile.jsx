import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchMyPatientProfile,
  updateMyPatientProfile,
} from "../../store/slice/PatientProfileSlice";
import { userService } from "../../services/UserService";
import dayjs from "dayjs";
import {
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  message,
  Spin,
  Typography,
  Divider,
  Avatar,
  Upload,
  DatePicker,
} from "antd";
import {
  SaveOutlined,
  UserOutlined,
  UploadOutlined,
  HeartOutlined,
  ProfileOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;

const PatientProfile = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  // Redux state cho Patient Profile
  const { profile: patientProfile, isLoading: profileLoading } = useSelector(
    (state) => state.patientProfile,
  );

  // Local state cho User Info
  const [userInfo, setUserInfo] = useState(null);
  const [userLoading, setUserLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // ĐÃ SỬA: Hàm xử lý URL ảnh chuẩn xác cho môi trường thực tế
  const getImageUrl = (url) => {
    if (!url) return null;
    const baseUrl = import.meta.env.VITE_BACKEND_URL;

    // 1. Chuyển đổi IP cũ thành HTTPS mới
    if (url.includes("203.145.47.214:5173")) {
      return url.replace("http://203.145.47.214:5173", baseUrl);
    }

    // 2. Trả về nguyên bản nếu là link ngoài đã chuẩn HTTP/HTTPS
    if (url.startsWith("http")) return url;

    // 3. Xử lý đường dẫn tương đối, chống lỗi nối trùng chữ /api/api
    const cleanUrl = url.startsWith("/") ? url : `/${url}`;
    if (cleanUrl.startsWith("/api/")) {
      return `${baseUrl}${cleanUrl}`;
    }

    return `${baseUrl}/api${cleanUrl}`;
  };

  // 1. Lấy dữ liệu khi vào trang (Cả User Info và Patient Profile)
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
      // Gọi Redux Thunk lấy hồ sơ bệnh nhân
      dispatch(fetchMyPatientProfile());
    };
    fetchAllData();
  }, [dispatch]);

  // 2. Đổ dữ liệu vào Form
  useEffect(() => {
    if (patientProfile && userInfo) {
      form.setFieldsValue({
        // User fields
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        phone: userInfo.phone,
        dob: userInfo.dob ? dayjs(userInfo.dob, "YYYY-MM-DD") : null,
        // Patient Profile fields
        gender: patientProfile.gender, // true hoặc false
        height: patientProfile.height,
        weight: patientProfile.weight,
        skinType: patientProfile.skinType,
        allergies: patientProfile.allergies,
        address: patientProfile.address,
      });
    }
  }, [patientProfile, userInfo, form]);

  // 3. Xử lý khi bấm Lưu Toàn Bộ
  const onFinish = async (values) => {
    setIsUpdating(true);
    try {
      // BƯỚC 1: UPDATE USER INFO (Gửi FormData để xử lý avatar)
      const userFormData = new FormData();
      if (avatarFile) {
        userFormData.append("avatar", avatarFile);
      }
      const userData = {
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
        password: values.password,
        roles: ["PATIENT"],
        dob: values.dob ? values.dob.format("YYYY-MM-DD") : null,
      };
      userFormData.append(
        "data",
        new Blob([JSON.stringify(userData)], { type: "application/json" }),
      );

      await userService.updateMyInfo(userFormData);

      const patientData = {
        gender: values.gender,
        height: values.height,
        weight: values.weight,
        skinType: values.skinType,
        allergies: values.allergies,
        address: values.address,
      };

      await dispatch(updateMyPatientProfile(patientData)).unwrap();

      message.success("Cập nhật toàn bộ hồ sơ thành công!");
      form.setFieldsValue({ password: "" });
    } catch (error) {
      // 🚨 FIX LỖI TẠI ĐÂY: Ép kiểu lỗi về dạng String
      const errorMsg =
        error?.response?.data?.message ||
        (typeof error === "string" ? error : error?.message) ||
        "Cập nhật thất bại, vui lòng thử lại!";
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
    return false; // Chặn upload mặc định của Antd
  };

  const isLoading = profileLoading || userLoading;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 flex justify-center">
      <div className="max-w-4xl w-full">
        <Card
          className="shadow-sm border-slate-200 rounded-2xl overflow-hidden"
          bodyStyle={{ padding: 0 }}
        >
          {/* Header Xanh Biển siêu đẹp */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-8 text-white text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-white/50 backdrop-blur-sm">
              <HeartOutlined className="text-4xl text-white" />
            </div>
            <Title level={3} className="!text-white !m-0 !mb-1">
              Hồ sơ Y tế & Cá nhân
            </Title>
            <Text className="text-blue-100 text-sm">
              Thông tin này giúp bác sĩ và hệ thống chẩn đoán AI đưa ra phác đồ
              điều trị chính xác nhất cho bạn.
            </Text>
          </div>

          {/* Form Content */}
          <Spin spinning={isLoading} tip="Đang đồng bộ dữ liệu...">
            <div className="p-4 md:p-8">
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
                  {/* Cột Upload Avatar */}
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

                  {/* Lưới nhập thông tin */}
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
                      rules={[
                        { required: true, message: "Vui lòng nhập tên!" },
                      ]}
                    >
                      <Input size="large" />
                    </Form.Item>

                    <Form.Item
                      name="phone"
                      label={<span className="font-medium">Số điện thoại</span>}
                      rules={[
                        {
                          required: true,
                          message: "Vui lòng nhập số điện thoại!",
                        },
                      ]}
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
                          message: "Nhập mật khẩu để xác nhận lưu!",
                        },
                        { min: 8, message: "Mật khẩu tối thiểu 8 ký tự" },
                      ]}
                      tooltip="Hệ thống yêu cầu nhập mật khẩu (cũ hoặc mới) để bảo mật tài khoản."
                    >
                      <Input.Password
                        size="large"
                        placeholder="Nhập mật khẩu..."
                      />
                    </Form.Item>
                  </div>
                </div>

                {/* --- PHẦN 2: THÔNG TIN Y TẾ (PATIENT PROFILE) --- */}
                <Divider orientation="left" plain className="mt-8">
                  <span className="text-blue-600 font-bold text-base flex items-center gap-2">
                    <ProfileOutlined /> 2. Chỉ số Y tế & Giao hàng
                  </span>
                </Divider>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                  <Form.Item
                    name="gender"
                    label={
                      <span className="font-medium text-slate-700">
                        Giới tính y khoa
                      </span>
                    }
                    rules={[
                      { required: true, message: "Vui lòng chọn giới tính!" },
                    ]}
                  >
                    <Select
                      size="large"
                      placeholder="Chọn giới tính"
                      className="rounded-lg"
                    >
                      <Option value={true}>Nam</Option>
                      <Option value={false}>Nữ</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="skinType"
                    label={
                      <span className="font-medium text-slate-700">
                        Loại da của bạn
                      </span>
                    }
                  >
                    <Select size="large" placeholder="Chọn loại da" allowClear>
                      <Option value="Da thường">Da thường</Option>
                      <Option value="Da khô">Da khô</Option>
                      <Option value="Da dầu">Da dầu</Option>
                      <Option value="Da hỗn hợp">Da hỗn hợp</Option>
                      <Option value="Da nhạy cảm">Da nhạy cảm</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="height"
                    label={
                      <span className="font-medium text-slate-700">
                        Chiều cao (cm)
                      </span>
                    }
                    rules={[
                      { required: true, message: "Vui lòng nhập chiều cao!" },
                      {
                        type: "number",
                        min: 1,
                        message: "Chiều cao phải lớn hơn 0",
                      },
                    ]}
                  >
                    <InputNumber
                      size="large"
                      className="w-full"
                      placeholder="VD: 170"
                    />
                  </Form.Item>

                  <Form.Item
                    name="weight"
                    label={
                      <span className="font-medium text-slate-700">
                        Cân nặng (kg)
                      </span>
                    }
                    rules={[
                      { required: true, message: "Vui lòng nhập cân nặng!" },
                      {
                        type: "number",
                        min: 1,
                        message: "Cân nặng phải lớn hơn 0",
                      },
                    ]}
                  >
                    <InputNumber
                      size="large"
                      className="w-full"
                      placeholder="VD: 60"
                    />
                  </Form.Item>
                </div>

                <Form.Item
                  name="allergies"
                  label={
                    <span className="font-medium text-slate-700">
                      Tiền sử dị ứng (Thuốc, thức ăn, mỹ phẩm...)
                    </span>
                  }
                >
                  <Input.TextArea
                    size="large"
                    rows={3}
                    placeholder="Nếu có dị ứng với bất kỳ thành phần nào, vui lòng ghi rõ tại đây..."
                    className="rounded-xl"
                  />
                </Form.Item>

                <Form.Item
                  name="address"
                  label={
                    <span className="font-medium text-slate-700">
                      Địa chỉ giao hàng mặc định
                    </span>
                  }
                >
                  <Input.TextArea
                    size="large"
                    rows={2}
                    placeholder="Nhập địa chỉ nhận thuốc / sản phẩm..."
                    className="rounded-xl"
                  />
                </Form.Item>

                <div className="flex justify-end mt-8 border-t pt-6">
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    icon={<SaveOutlined />}
                    loading={isUpdating}
                    className="bg-blue-600 hover:bg-blue-700 px-10 rounded-xl font-semibold h-12 w-full md:w-auto"
                  >
                    Lưu Toàn Bộ Hồ Sơ
                  </Button>
                </div>
              </Form>
            </div>
          </Spin>
        </Card>
      </div>
    </div>
  );
};

export default PatientProfile;
