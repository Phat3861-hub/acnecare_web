import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  message,
  Spin,
  Alert,
  Tag,
  Avatar,
  Divider,
  Upload,
  DatePicker,
} from "antd";
import {
  ShopOutlined,
  GlobalOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  CloseCircleOutlined,
  UserOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import { fetchMyBrandProfile } from "../../store/slice/BrandSlice";
import { brandService } from "../../services/BrandService";
import { userService } from "../../services/UserService";

const { TextArea } = Input;

const BrandProfile = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const { profile: brandProfile, loading: brandLoading } = useSelector(
    (state) => state.brand,
  );

  // Local states cho User Info (Đại diện Brand)
  const [userInfo, setUserInfo] = useState(null);
  const [userLoading, setUserLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [logoPreview, setLogoPreview] = useState("");

  // ĐÃ SỬA: Đồng bộ hàm getImageUrl thông minh để fix triệt để lỗi 400 và Mixed Content
  const getImageUrl = (url) => {
    if (!url) return null;
    const baseUrl = import.meta.env.VITE_BACKEND_URL;

    // 1. Tự động chuyển đổi IP cũ thành Domain HTTPS mới
    if (url.includes("203.145.47.214:5173")) {
      return url.replace("http://203.145.47.214:5173", baseUrl);
    }

    // 2. Trả về nguyên bản nếu là link ngoài đã chuẩn HTTP/HTTPS (vd: Google Avatar, link drive)
    if (url.startsWith("http")) return url;

    // 3. Xử lý đường dẫn tương đối, chống lỗi nối trùng chữ /api/api
    const cleanUrl = url.startsWith("/") ? url : `/${url}`;
    if (cleanUrl.startsWith("/api/")) {
      return `${baseUrl}${cleanUrl}`;
    }

    return `${baseUrl}/api${cleanUrl}`;
  };

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
        message.error("Lỗi lấy thông tin tài khoản đại diện!");
      } finally {
        setUserLoading(false);
      }
      dispatch(fetchMyBrandProfile());
    };
    fetchAllData();
  }, [dispatch]);

  useEffect(() => {
    if (brandProfile && userInfo) {
      form.setFieldsValue({
        // User Info (Đại diện)
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        phone: userInfo.phone,
        dob: userInfo.dob ? dayjs(userInfo.dob, "YYYY-MM-DD") : null,
        // Brand Profile Info
        brandName: brandProfile.brandName,
        description: brandProfile.description,
        website: brandProfile.website,
        logoUrl: brandProfile.logoUrl,
      });
      setLogoPreview(getImageUrl(brandProfile.logoUrl));
    }
  }, [brandProfile, userInfo, form]);

  const onFinish = async (values) => {
    setUpdating(true);
    try {
      // 1. UPDATE USER INFO (Đại diện)
      const userFormData = new FormData();
      if (avatarFile) {
        userFormData.append("avatar", avatarFile);
      }
      const userData = {
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
        password: values.password, // Bắt buộc
        roles: ["BRAND"],
        dob: values.dob ? values.dob.format("YYYY-MM-DD") : null,
      };
      userFormData.append(
        "data",
        new Blob([JSON.stringify(userData)], { type: "application/json" }),
      );

      await userService.updateMyInfo(userFormData);

      // 2. UPDATE BRAND PROFILE
      const brandData = {
        brandName: values.brandName,
        description: values.description,
        website: values.website,
        logoUrl: values.logoUrl,
      };
      await brandService.updateMyProfile(brandData);

      message.success("Cập nhật toàn bộ hồ sơ thành công!");
      form.setFieldsValue({ password: "" });
      dispatch(fetchMyBrandProfile()); // Load lại dữ liệu Brand
    } catch (error) {
      message.error(
        error.response?.data?.message || error || "Cập nhật thất bại!",
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleAvatarChange = (info) => {
    if (info.file) {
      setAvatarFile(info.file);
      setAvatarPreview(URL.createObjectURL(info.file));
    }
    return false;
  };

  const getStatusTag = (status, reason) => {
    switch (status) {
      case "ACCEPTED":
      case "APPROVED":
        return (
          <Tag
            icon={<CheckCircleOutlined />}
            color="success"
            className="text-sm px-3 py-1"
          >
            Đã xác minh
          </Tag>
        );
      case "REJECTED":
        return (
          <div className="flex flex-col gap-2">
            <Tag
              icon={<CloseCircleOutlined />}
              color="error"
              className="text-sm px-3 py-1 w-fit"
            >
              Từ chối xác minh
            </Tag>
            {reason && (
              <span className="text-red-500 text-xs italic">
                Lý do: {reason}
              </span>
            )}
          </div>
        );
      default:
        return (
          <Tag
            icon={<SyncOutlined spin />}
            color="processing"
            className="text-sm px-3 py-1"
          >
            Đang chờ duyệt
          </Tag>
        );
    }
  };

  const isLoading = brandLoading || userLoading;

  if (isLoading && !brandProfile && !userInfo) {
    return (
      <div className="flex justify-center py-20">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Hồ sơ Thương hiệu & Đại diện
        </h2>
        <p className="text-gray-500 text-sm">
          Cập nhật thông tin cá nhân và thông tin hiển thị của nhãn hàng.
        </p>
      </div>

      <Card
        className="shadow-sm border-gray-100 rounded-xl"
        title="Tổng quan"
        loading={isLoading}
      >
        <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-start md:items-center justify-between flex-col md:flex-row gap-4">
          <div className="flex items-center gap-4">
            <Avatar
              size={64}
              src={logoPreview || "https://via.placeholder.com/64"}
              shape="square"
              className="shadow-sm border object-cover bg-white"
            />
            <div>
              <div className="font-bold text-lg">
                {brandProfile?.brandName || "Tên thương hiệu chưa cập nhật"}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Gia nhập:{" "}
                {brandProfile?.createdAt
                  ? new Date(brandProfile.createdAt).toLocaleDateString("vi-VN")
                  : "N/A"}
              </div>
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wider">
              Trạng thái kiểm duyệt
            </div>
            {getStatusTag(
              brandProfile?.verificationStatus,
              brandProfile?.rejectionReason,
            )}
          </div>
        </div>

        {brandProfile?.verificationStatus === "REJECTED" && (
          <Alert
            message="Hồ sơ bị từ chối"
            description="Vui lòng cập nhật lại thông tin chính xác để Admin xem xét lại."
            type="error"
            showIcon
            className="mb-6"
          />
        )}

        <Form form={form} layout="vertical" onFinish={onFinish}>
          {/* --- PHẦN 1: THÔNG TIN NGƯỜI ĐẠI DIỆN (USER) --- */}
          <Divider orientation="left" plain>
            <span className="text-purple-600 font-bold text-base flex items-center gap-2">
              <UserOutlined /> 1. Thông tin người đại diện (Tài khoản)
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
                  Ảnh Đại Diện
                </Button>
              </Upload>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-6">
              <Form.Item
                name="firstName"
                label={<span className="font-medium">Họ người đại diện</span>}
                rules={[{ required: true }]}
              >
                <Input size="large" />
              </Form.Item>
              <Form.Item
                name="lastName"
                label={<span className="font-medium">Tên người đại diện</span>}
                rules={[{ required: true }]}
              >
                <Input size="large" />
              </Form.Item>
              <Form.Item
                name="phone"
                label={
                  <span className="font-medium">Số điện thoại liên hệ</span>
                }
                rules={[{ required: true }]}
              >
                <Input size="large" />
              </Form.Item>
              <Form.Item
                name="dob"
                label={<span className="font-medium">Ngày sinh</span>}
                rules={[{ required: true }]}
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
                  { required: true, message: "Nhập mật khẩu để xác nhận lưu" },
                  { min: 8 },
                ]}
                tooltip="Hệ thống yêu cầu xác nhận mật khẩu để lưu trữ thông tin."
              >
                <Input.Password size="large" placeholder="Nhập mật khẩu..." />
              </Form.Item>
            </div>
          </div>

          {/* --- PHẦN 2: THÔNG TIN THƯƠNG HIỆU (BRAND PROFILE) --- */}
          <Divider orientation="left" plain className="mt-4">
            <span className="text-purple-600 font-bold text-base flex items-center gap-2">
              <ShopOutlined /> 2. Thôngত্তি Brand hiển thị
            </span>
          </Divider>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Form.Item
              label="Tên thương hiệu"
              name="brandName"
              rules={[
                { required: true, message: "Vui lòng nhập tên thương hiệu!" },
              ]}
            >
              <Input
                size="large"
                prefix={<ShopOutlined className="text-gray-400" />}
                placeholder="Tên nhãn hàng..."
              />
            </Form.Item>

            <Form.Item
              label="Trang web chính thức (Website)"
              name="website"
              rules={[
                { type: "url", message: "Vui lòng nhập đúng định dạng URL!" },
              ]}
            >
              <Input
                size="large"
                prefix={<GlobalOutlined className="text-gray-400" />}
                placeholder="https://..."
              />
            </Form.Item>
          </div>

          <Form.Item
            label="Đường dẫn Ảnh Logo thương hiệu (URL)"
            name="logoUrl"
            rules={[{ type: "url" }]}
          >
            <Input
              size="large"
              placeholder="https://..."
              onChange={(e) => setLogoPreview(getImageUrl(e.target.value))}
            />
          </Form.Item>

          <Form.Item label="Giới thiệu về thương hiệu" name="description">
            <TextArea
              rows={4}
              placeholder="Viết vài dòng giới thiệu về triết lý, sứ mệnh..."
            />
          </Form.Item>

          <div className="flex justify-end mt-6 pt-4 border-t">
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={updating}
              className="px-8 font-semibold rounded-lg bg-[#1e255e]"
            >
              Lưu toàn bộ thay đổi
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default BrandProfile;
