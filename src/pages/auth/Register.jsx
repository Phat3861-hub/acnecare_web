import React, { useState } from "react";
import {
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

const { Option } = Select;

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [backendError, setBackendError] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
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
        let finalAvatarUrl = `https://ui-avatars.com/api/?name=${values.firstName}+${values.lastName}`;

        if (avatarFile) {
          const formData = new FormData();
          formData.append("file", avatarFile);
          console.log("Đã lấy được file ảnh để upload:", avatarFile.name);
        }

        const payload = {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone,
          password: values.password,
          dob: values.dob ? values.dob.format("YYYY-MM-DD") : null,
          avatarUrl: finalAvatarUrl,
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
    <div className="flex min-h-screen bg-background">
      <div className="hidden w-1/2 items-center justify-center gradient-primary lg:flex">
        <div className="max-w-md px-12 text-white animate-fade-in">
          <img
            src="/acnecare_logo.png"
            alt="AcneCare Logo"
            className="h-14 w-14 object-contain"
          />

          <h2 className="text-4xl font-black leading-tight text-balance">
            Cùng AcneCare
            <br />
            chăm sóc làn da
            <br />
            mỗi ngày
          </h2>

          <p className="mt-5 text-lg leading-8 text-white/85">
            Tạo tài khoản để bắt đầu hành trình chăm sóc da thông minh và kết
            nối với hệ sinh thái dịch vụ phù hợp cho bạn.
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-12 md:px-8">
        <div className="w-full max-w-2xl animate-fade-up">
          <Link to="/" className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-auth text-base font-extrabold text-white">
              A
            </div>
            <span className="text-xl font-bold text-auth">AcneCare</span>
          </Link>

          <div className="rounded-2xl border border-auth bg-card p-8 shadow-auth md:p-10">
            <h1 className="text-3xl font-black text-foreground">
              Tạo tài khoản
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Bắt đầu hành trình chăm sóc da của bạn
            </p>

            {backendError && (
              <Alert
                description={backendError}
                type="error"
                showIcon
                className="mt-5"
              />
            )}

            <form className="mt-6 space-y-5" onSubmit={formik.handleSubmit}>
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  Ảnh đại diện
                </label>
                <Upload
                  listType="picture"
                  maxCount={1}
                  beforeUpload={(file) => {
                    setAvatarFile(file);
                    return false;
                  }}
                  onRemove={() => setAvatarFile(null)}
                >
                  <Button
                    icon={<UploadOutlined />}
                    className="!h-11 !rounded-xl !border-auth"
                  >
                    Chọn ảnh đại diện
                  </Button>
                </Upload>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-foreground">
                    Họ
                  </label>
                  <Input
                    size="large"
                    {...formik.getFieldProps("firstName")}
                    placeholder="VD: Nguyễn"
                    className="!rounded-xl !py-2"
                  />
                  {formik.touched.firstName && formik.errors.firstName && (
                    <div className="mt-1.5 text-sm text-red-500">
                      {formik.errors.firstName}
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-foreground">
                    Tên
                  </label>
                  <Input
                    size="large"
                    {...formik.getFieldProps("lastName")}
                    placeholder="VD: Văn A"
                    className="!rounded-xl !py-2"
                  />
                  {formik.touched.lastName && formik.errors.lastName && (
                    <div className="mt-1.5 text-sm text-red-500">
                      {formik.errors.lastName}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-foreground">
                    Email
                  </label>
                  <Input
                    size="large"
                    {...formik.getFieldProps("email")}
                    placeholder="email@gmail.com"
                    className="!rounded-xl !py-2"
                  />
                  {formik.touched.email && formik.errors.email && (
                    <div className="mt-1.5 text-sm text-red-500">
                      {formik.errors.email}
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-foreground">
                    Số điện thoại
                  </label>
                  <Input
                    size="large"
                    {...formik.getFieldProps("phone")}
                    placeholder="0901234567"
                    className="!rounded-xl !py-2"
                  />
                  {formik.touched.phone && formik.errors.phone && (
                    <div className="mt-1.5 text-sm text-red-500">
                      {formik.errors.phone}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-foreground">
                    Ngày sinh
                  </label>
                  <DatePicker
                    size="large"
                    className="!h-11 !w-full !rounded-xl"
                    format="YYYY-MM-DD"
                    placeholder="Chọn ngày sinh"
                    onChange={(date) => formik.setFieldValue("dob", date)}
                    onBlur={() => formik.setFieldTouched("dob", true)}
                  />
                  {formik.touched.dob && formik.errors.dob && (
                    <div className="mt-1.5 text-sm text-red-500">
                      {formik.errors.dob}
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-foreground">
                    Vai trò
                  </label>
                  <Select
                    size="large"
                    value={formik.values.role}
                    onChange={(value) => formik.setFieldValue("role", value)}
                    className="w-full"
                  >
                    <Option value="PATIENT">Người dùng</Option>
                    <Option value="DOCTOR">Bác sĩ</Option>
                    <Option value="BRAND">Thương hiệu</Option>
                  </Select>
                  {formik.touched.role && formik.errors.role && (
                    <div className="mt-1.5 text-sm text-red-500">
                      {formik.errors.role}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  Mật khẩu
                </label>
                <Input.Password
                  size="large"
                  {...formik.getFieldProps("password")}
                  placeholder="Nhập mật khẩu"
                  className="!rounded-xl !py-2"
                />
                {formik.touched.password && formik.errors.password && (
                  <div className="mt-1.5 text-sm text-red-500">
                    {formik.errors.password}
                  </div>
                )}
              </div>

              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={loading}
                className="!mt-2 !h-12 !rounded-xl !border-none !bg-[#1e255e] !font-semibold hover:!bg-[#2a3175]"
              >
                Đăng ký
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Đã có tài khoản?{" "}
              <Link
                to="/auth/login"
                className="font-semibold text-auth hover:underline"
              >
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
