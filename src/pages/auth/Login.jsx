import React, { useState } from "react";
import { Input, Button, message, Alert } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useFormik } from "formik";
import * as Yup from "yup";
import { GoogleOutlined } from "@ant-design/icons";

import { authService } from "../../services/AuthService";
import { userService } from "../../services/UserService"; // 🚨 THÊM IMPORT NÀY
import { setCredentials } from "../../store/slice/UserSlice";
import "./Login.css";

const resolvePrimaryRole = (roles) => {
  if (!Array.isArray(roles)) {
    return "PATIENT";
  }

  const roleNames = roles
    .map((role) => role?.name)
    .filter(Boolean)
    .map((name) => name.toUpperCase());

  if (roleNames.includes("ADMIN")) return "ADMIN";
  if (roleNames.includes("DOCTOR")) return "DOCTOR";
  if (roleNames.includes("BRAND")) return "BRAND";
  if (roleNames.includes("PATIENT")) return "PATIENT";
  return "PATIENT";
};

const normalizeUserProfile = (profile) => {
  if (!profile) return null;

  return {
    ...profile,
    id: profile.id ?? profile.user_id,
    firstName: profile.firstName ?? profile.first_name ?? "",
    lastName: profile.lastName ?? profile.last_name ?? "",
    phone: profile.phone ?? "",
    dob: profile.dob ?? null,
    avatarUrl: profile.avatarUrl ?? profile.avatar_url ?? null,
    roles: profile.roles ?? [],
    hasPassword: Boolean(profile.hasPassword),
    googleLinked: Boolean(profile.googleLinked),
  };
};

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [backendError, setBackendError] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const googleClientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID || import.meta.env.VITE_GOOGLE_CLIENT;
  const googleRedirectUri =
    import.meta.env.VITE_GOOGLE_REDIRECT_URI ||
    `${window.location.origin}/authenticate`;

  const handleGoogleLogin = () => {
    if (!googleClientId) {
      message.error("Thiếu cấu hình VITE_GOOGLE_CLIENT_ID (hoặc VITE_GOOGLE_CLIENT).");
      return;
    }

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", googleClientId);
    authUrl.searchParams.set("redirect_uri", googleRedirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "openid email profile");
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");

    window.location.href = authUrl.toString();
  };

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
          try {
            const userRes = await userService.getMyInfo();
            const rawUserInfo = userRes.data?.result || userRes.data;
            const realUserInfo = normalizeUserProfile(rawUserInfo);
            const role = resolvePrimaryRole(realUserInfo.roles);

            dispatch(
              setCredentials({
                user: {
                  ...realUserInfo,
                  role,
                },
              }),
            );

            message.success("Đăng nhập thành công!");
            if (role === "ADMIN") navigate("/admin/dashboard");
            else if (role === "DOCTOR") navigate("/doctor/schedule");
            else if (role === "BRAND") navigate("/brand/profile");
            else navigate("/");
          } catch (profileError) {
            console.error("Lỗi lấy thông tin profile:", profileError);
            message.error("Không thể tải thông tin người dùng sau đăng nhập.");
          }
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
    <div className="auth-wrapper flex min-h-screen bg-background">
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
              <Button
                size="large"
                block
                icon={<GoogleOutlined />}
                className="!h-12 !rounded-xl !font-semibold"
                onClick={handleGoogleLogin}
              >
                Đăng nhập Google
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
