import React, { useEffect } from "react";
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
} from "antd";
import {
  UserOutlined,
  SaveOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  CloseCircleOutlined,
  StarFilled,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import {
  fetchDoctorProfile,
  updateDoctorProfile,
} from "../../store/slice/DoctorProfileSlice";

const { Title, Text } = Typography;
const { TextArea } = Input;

const DoctorProfile = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const { profile, loading } = useSelector((state) => state.doctorProfile);

  // Load dữ liệu khi vào trang
  useEffect(() => {
    dispatch(fetchDoctorProfile());
  }, [dispatch]);

  // Đổ dữ liệu từ Redux vào Form
  useEffect(() => {
    if (profile) {
      form.setFieldsValue({
        dob: profile.dob ? dayjs(profile.dob, "YYYY-MM-DD") : null,
        licenseUrl: profile.licenseUrl,
        specialty: profile.specialty,
        bio: profile.bio,
        clinicName: profile.clinicName,
        yearsExperience: profile.yearsExperience,
        address: profile.address,
        isAcceptingAppointments: profile.acceptingAppointments, // Map với biến DTO
      });
    }
  }, [profile, form]);

  const onFinish = async (values) => {
    try {
      const requestData = {
        ...values,
        dob: values.dob ? values.dob.format("YYYY-MM-DD") : null,
      };

      await dispatch(updateDoctorProfile(requestData)).unwrap();
      message.success("Cập nhật hồ sơ thành công!");
    } catch (error) {
      message.error(error || "Có lỗi xảy ra khi cập nhật hồ sơ.");
    }
  };

  // Render trạng thái phê duyệt (Verification Status)
  const renderVerificationStatus = (status) => {
    switch (status) {
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

  return (
    <div className="p-3 sm:p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-xl md:text-2xl font-bold mb-6 text-gray-800">
          Thông Tin Cá Nhân & Chuyên Môn
        </h2>

        {/* Khối Hiển Thị Chỉ Số (Read-Only) */}
        {profile && (
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
                    renderVerificationStatus(profile.verificationStatus)
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
                  value={profile.ratingAvg || 0}
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
                  value={profile.ratingCount || 0}
                  suffix={<span className="text-sm text-gray-400">lượt</span>}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* Cảnh báo nếu bị từ chối */}
        {profile?.verificationStatus === "REJECTED" &&
          profile?.rejectionReason && (
            <Alert
              message="Hồ sơ của bạn bị từ chối!"
              description={`Lý do: ${profile.rejectionReason}. Vui lòng cập nhật lại thông tin.`}
              type="error"
              showIcon
              className="mb-6 rounded-lg"
            />
          )}

        {/* Khối Form Cập Nhật */}
        <Card className="rounded-xl shadow-sm border border-gray-200">
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            className="mt-2"
          >
            <Divider orientation="left" plain>
              <span className="text-blue-600 font-bold text-base">
                1. Thông tin cơ bản
              </span>
            </Divider>

            <Row gutter={[24, 0]}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="dob"
                  label={<span className="font-medium">Ngày sinh</span>}
                >
                  <DatePicker
                    className="w-full"
                    size="large"
                    format="DD/MM/YYYY"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="address"
                  label={<span className="font-medium">Địa chỉ liên hệ</span>}
                  rules={[
                    { required: true, message: "Vui lòng nhập địa chỉ!" },
                    {
                      max: 255,
                      message: "Địa chỉ không được vượt quá 255 ký tự",
                    },
                  ]}
                >
                  <Input
                    size="large"
                    placeholder="Ví dụ: 123 Đường ABC, Quận X..."
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider orientation="left" plain className="mt-4">
              <span className="text-blue-600 font-bold text-base">
                2. Thông tin chuyên môn
              </span>
            </Divider>

            <Row gutter={[24, 0]}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="specialty"
                  label={<span className="font-medium">Chuyên khoa</span>}
                  rules={[
                    {
                      max: 100,
                      message: "Chuyên khoa không vượt quá 100 ký tự",
                    },
                  ]}
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
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng nhập tên nơi công tác!",
                    },
                    { max: 200, message: "Tên không được vượt quá 200 ký tự" },
                  ]}
                >
                  <Input size="large" placeholder="Phòng khám Da liễu ABC..." />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="licenseUrl"
                  label={
                    <span className="font-medium">
                      Đường dẫn Giấy phép hành nghề (URL)
                    </span>
                  }
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng cung cấp link giấy phép!",
                    },
                    {
                      type: "url",
                      message: "Vui lòng nhập đúng định dạng URL (http://...)",
                    },
                  ]}
                >
                  <Input
                    size="large"
                    placeholder="https://drive.google.com/..."
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="bio"
              label={
                <span className="font-medium">Giới thiệu bản thân (Bio)</span>
              }
              rules={[
                {
                  max: 500,
                  message: "Giới thiệu không được vượt quá 500 ký tự",
                },
              ]}
            >
              <TextArea
                rows={4}
                placeholder="Giới thiệu ngắn gọn về kinh nghiệm, chứng chỉ, và phương châm làm việc của bạn..."
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
                loading={loading}
                className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto px-8"
              >
                Cập Nhật Hồ Sơ
              </Button>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default DoctorProfile;
