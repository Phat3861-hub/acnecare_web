import React, { useState } from "react";
import { Input, Button, message, Alert } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useFormik } from "formik";
import * as Yup from "yup";
import { jwtDecode } from "jwt-decode";

import { authService } from "../../services/AuthService";
import { setCredentials } from "../../store/slice/UserSlice";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [backendError, setBackendError] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const formik = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema: Yup.object({
      email: Yup.string()
        .email("Vui lòng nhập email hợp lệ!")
        .required("Vui lòng nhập email!"),
      password: Yup.string().required("Vui lòng nhập mật khẩu!"),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      setBackendError("");

      try {
        const res = await authService.login(values);

        if (res.data.code === 1000) {
          const tokenBody = res.data.result.accessToken;
          const decodedToken = jwtDecode(tokenBody);
          const tokenRoles = decodedToken.roles || "";

          let role = "PATIENT";
          if (tokenRoles.includes("ADMIN")) role = "ADMIN";
          else if (tokenRoles.includes("DOCTOR")) role = "DOCTOR";
          else if (tokenRoles.includes("BRAND")) role = "BRAND";

          dispatch(
            setCredentials({
              user: {
                id: decodedToken.sub,
                role: role,
              },
            }),
          );

          message.success("Đăng nhập thành công!");

          if (role === "ADMIN") navigate("/admin/dashboard");
          else if (role === "DOCTOR") navigate("/doctor/schedule");
          else if (role === "BRAND") navigate("/brand/");
          else navigate("/");
        }
      } catch (error) {
        setBackendError(
          error.response?.data?.message || "Sai email hoặc mật khẩu!",
        );
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
            Chào mừng bạn đến với
            <br />
            AcneCare
          </h2>

          <p className="mt-5 text-lg leading-8 text-white/85">
            Nền tảng chăm sóc da thông minh, kết nối bạn với đội ngũ bác sĩ
            chuyên khoa da liễu hàng đầu.
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-12 md:px-8">
        <div className="w-full max-w-md animate-fade-up">
          <Link to="/" className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-auth text-base font-extrabold text-white">
              A
            </div>
            <span className="text-xl font-bold text-auth">AcneCare</span>
          </Link>

          <div className="rounded-2xl border border-auth bg-card p-8 shadow-auth md:p-10">
            <h1 className="text-3xl font-black text-foreground">Đăng nhập</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Chào mừng bạn quay lại
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
                  Email
                </label>
                <Input
                  size="large"
                  {...formik.getFieldProps("email")}
                  placeholder="you@example.com"
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
                  Mật khẩu
                </label>
                <Input.Password
                  size="large"
                  {...formik.getFieldProps("password")}
                  placeholder="••••••••"
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
                Đăng nhập
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Chưa có tài khoản?{" "}
              <Link
                to="/auth/register"
                className="font-semibold text-auth hover:underline"
              >
                Đăng ký
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
