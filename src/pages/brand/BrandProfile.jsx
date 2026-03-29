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
} from "antd";
import {
  ShopOutlined,
  GlobalOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyBrandProfile } from "../../store/slice/BrandSlice";
import { brandService } from "../../services/BrandService";

const { TextArea } = Input;

const BrandProfile = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const { profile, loading } = useSelector((state) => state.brand);
  const [updating, setUpdating] = useState(false);
  const [logoPreview, setLogoPreview] = useState("");

  useEffect(() => {
    dispatch(fetchMyBrandProfile());
  }, [dispatch]);

  useEffect(() => {
    if (profile) {
      form.setFieldsValue({
        brandName: profile.brandName,
        description: profile.description,
        website: profile.website,
        logoUrl: profile.logoUrl,
      });
      setLogoPreview(profile.logoUrl);
    }
  }, [profile, form]);

  const onFinish = async (values) => {
    setUpdating(true);
    try {
      await brandService.updateMyProfile(values);
      message.success("Cập nhật hồ sơ thương hiệu thành công!");
      dispatch(fetchMyBrandProfile()); // Load lại dữ liệu mới
    } catch (error) {
      message.error(error.response?.data?.message || "Cập nhật thất bại!");
    } finally {
      setUpdating(false);
    }
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

  if (loading && !profile) {
    return (
      <div className="flex justify-center py-20">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Hồ sơ Thương hiệu</h2>
        <p className="text-gray-500 text-sm">
          Cập nhật thông tin để khách hàng hiểu rõ hơn về nhãn hàng của bạn.
        </p>
      </div>

      <Card
        className="shadow-sm border-gray-100 rounded-xl"
        title="Thông tin cơ bản"
      >
        <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-start md:items-center justify-between flex-col md:flex-row gap-4">
          <div className="flex items-center gap-4">
            <Avatar
              size={64}
              src={logoPreview || "https://via.placeholder.com/64"}
              shape="square"
              className="shadow-sm border"
            />
            <div>
              <div className="font-bold text-lg">
                {profile?.brandName || "Tên thương hiệu chưa cập nhật"}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Gia nhập:{" "}
                {new Date(profile?.createdAt).toLocaleDateString("vi-VN")}
              </div>
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wider">
              Trạng thái kiểm duyệt
            </div>
            {getStatusTag(
              profile?.verificationStatus,
              profile?.rejectionReason,
            )}
          </div>
        </div>

        {profile?.verificationStatus === "REJECTED" && (
          <Alert
            message="Hồ sơ bị từ chối"
            description="Vui lòng cập nhật lại thông tin chính xác để Admin xem xét lại."
            type="error"
            showIcon
            className="mb-6"
          />
        )}

        <Form form={form} layout="vertical" onFinish={onFinish}>
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
                placeholder="Nhập tên thương hiệu của bạn"
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
            label="Đường dẫn Ảnh Logo (URL)"
            name="logoUrl"
            rules={[
              { type: "url", message: "Vui lòng nhập đúng định dạng URL!" },
            ]}
          >
            <Input
              size="large"
              placeholder="https://..."
              onChange={(e) => setLogoPreview(e.target.value)}
            />
          </Form.Item>

          <Form.Item label="Giới thiệu về thương hiệu" name="description">
            <TextArea
              rows={4}
              placeholder="Viết vài dòng giới thiệu về triết lý, sứ mệnh hoặc lịch sử nhãn hàng của bạn..."
            />
          </Form.Item>

          <div className="flex justify-end mt-6">
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={updating}
              className="px-8 font-semibold rounded-lg bg-[#1e255e]"
            >
              Lưu thay đổi
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default BrandProfile;
