import React, { useState } from "react";
import {
  Form,
  Input,
  Button,
  Select,
  DatePicker,
  message,
  Alert,
  Upload,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { authService } from "../../services/AuthService";
// Giả sử bạn có 1 service upload file (Dùng lại của phần chat/sản phẩm)
// import { fileService } from '../../services/FileService';

const { Option } = Select;

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [backendError, setBackendError] = useState("");
  const [avatarFile, setAvatarFile] = useState(null); // State lưu trữ file ảnh
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      dob: null,
      role: "PATIENT",
    },
    validationSchema: Yup.object({
      firstName: Yup.string().required("Vui lòng nhập họ!"),
      lastName: Yup.string().required("Vui lòng nhập tên!"),
      email: Yup.string()
        .email("Email không hợp lệ!")
        .required("Vui lòng nhập email!"),
      phone: Yup.string()
        .matches(/^[0-9]{10,11}$/, "Số điện thoại không hợp lệ!")
        .required("Vui lòng nhập số điện thoại!"),
      password: Yup.string()
        .min(8, "Mật khẩu phải có ít nhất 8 ký tự!")
        .required("Vui lòng nhập mật khẩu!"),
      dob: Yup.date().nullable().required("Vui lòng chọn ngày sinh!"),
      role: Yup.string().required("Vui lòng chọn vai trò!"),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      setBackendError("");

      try {
        // 1. XỬ LÝ UPLOAD ẢNH TRƯỚC (NẾU CÓ)
        let finalAvatarUrl = `https://ui-avatars.com/api/?name=${values.firstName}+${values.lastName}`; // Ảnh mặc định

        if (avatarFile) {
          const formData = new FormData();
          formData.append("file", avatarFile); // "file" là tên biến mà Backend của bạn chờ nhận

          // TODO: Bỏ comment 2 dòng dưới khi bạn đã có API upload file
          // const uploadRes = await fileService.uploadImage(formData);
          // finalAvatarUrl = uploadRes.data.url; // Lấy link ảnh từ backend trả về

          console.log("Đã lấy được file ảnh để upload:", avatarFile.name);
        }

        // 2. TẠO PAYLOAD JSON VÀ GỌI API REGISTER
        const payload = {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone,
          password: values.password,
          dob: values.dob ? values.dob.format("YYYY-MM-DD") : null,
          avatarUrl: finalAvatarUrl, // Gắn link ảnh (hoặc link mặc định) vào đây
          roles: [values.role],
        };

        const res = await authService.register(payload);
        if (res.data.code === 1000) {
          message.success("Đăng ký thành công! Vui lòng đăng nhập.");
          navigate("/auth/login");
        }
      } catch (error) {
        const errorMsg =
          error.response?.data?.message ||
          "Đăng ký thất bại, vui lòng thử lại!";
        setBackendError(errorMsg);
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 py-10">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-lg">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Tạo tài khoản mới
        </h2>

        {backendError && (
          <Alert
            description={backendError}
            type="error"
            showIcon
            className="mb-4"
          />
        )}

        <Form layout="vertical" onFinish={formik.handleSubmit}>
          {/* Avatar Upload */}
          <Form.Item label="Ảnh đại diện (Không bắt buộc)">
            <Upload
              listType="picture"
              maxCount={1}
              beforeUpload={(file) => {
                setAvatarFile(file); // Lưu file vào state thay vì tự động upload
                return false; // Trả về false để ngăn Ant Design tự gọi API
              }}
              onRemove={() => setAvatarFile(null)} // Xóa file khỏi state nếu user bấm nút xóa
            >
              <Button icon={<UploadOutlined />}>Chọn ảnh đại diện</Button>
            </Upload>
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="Họ"
              validateStatus={
                formik.touched.firstName && formik.errors.firstName
                  ? "error"
                  : ""
              }
              help={formik.touched.firstName && formik.errors.firstName}
            >
              <Input
                size="large"
                {...formik.getFieldProps("firstName")}
                placeholder="VD: Nguyễn"
              />
            </Form.Item>
            <Form.Item
              label="Tên"
              validateStatus={
                formik.touched.lastName && formik.errors.lastName ? "error" : ""
              }
              help={formik.touched.lastName && formik.errors.lastName}
            >
              <Input
                size="large"
                {...formik.getFieldProps("lastName")}
                placeholder="VD: Văn A"
              />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="Email"
              validateStatus={
                formik.touched.email && formik.errors.email ? "error" : ""
              }
              help={formik.touched.email && formik.errors.email}
            >
              <Input
                size="large"
                {...formik.getFieldProps("email")}
                placeholder="email@gmail.com"
              />
            </Form.Item>
            <Form.Item
              label="Số điện thoại"
              validateStatus={
                formik.touched.phone && formik.errors.phone ? "error" : ""
              }
              help={formik.touched.phone && formik.errors.phone}
            >
              <Input
                size="large"
                {...formik.getFieldProps("phone")}
                placeholder="0901234567"
              />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="Ngày sinh"
              validateStatus={
                formik.touched.dob && formik.errors.dob ? "error" : ""
              }
              help={formik.touched.dob && formik.errors.dob}
            >
              <DatePicker
                size="large"
                className="w-full"
                format="YYYY-MM-DD"
                placeholder="Chọn ngày sinh"
                onChange={(date) => formik.setFieldValue("dob", date)}
                onBlur={() => formik.setFieldTouched("dob", true)}
              />
            </Form.Item>
            <Form.Item
              label="Vai trò"
              validateStatus={
                formik.touched.role && formik.errors.role ? "error" : ""
              }
              help={formik.touched.role && formik.errors.role}
            >
              <Select
                size="large"
                value={formik.values.role}
                onChange={(value) => formik.setFieldValue("role", value)}
              >
                <Option value="PATIENT">Người dùng</Option>
                <Option value="DOCTOR">Bác sĩ</Option>
                <Option value="BRAND">Thương hiệu</Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item
            label="Mật khẩu"
            validateStatus={
              formik.touched.password && formik.errors.password ? "error" : ""
            }
            help={formik.touched.password && formik.errors.password}
          >
            <Input.Password
              size="large"
              {...formik.getFieldProps("password")}
              placeholder="Nhập mật khẩu"
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={loading}
            className="bg-blue-600 mt-2"
          >
            Đăng ký
          </Button>
        </Form>
      </div>
    </div>
  );
};

export default Register;
