import React, { useState } from "react";
import { Form, Input, Button, message, Alert } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useFormik } from "formik";
import * as Yup from "yup";
import { authService } from "../../services/AuthService";
import { setCredentials } from "../../store/slice/UserSlice";
import { jwtDecode } from "jwt-decode";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [backendError, setBackendError] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
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
          const token = res.data.result.accessToken;
          const refreshToken = res.data.result.refreshToken || null;

          localStorage.setItem("accessToken", token);
          if (refreshToken) {
            localStorage.setItem("refreshToken", refreshToken);
          }

          const decodedToken = jwtDecode(token);

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
              accessToken: token,
              refreshToken: refreshToken,
            }),
          );

          message.success("Đăng nhập thành công!");

          if (role === "ADMIN") {
            navigate("/admin/dashboard");
          } else if (role === "DOCTOR") {
            navigate("/doctor/schedule");
          } else {
            navigate("/");
          }
        }
      } catch (error) {
        console.error("=== LỖI ===", error.response?.data);
        const errorMsg =
          error.response?.data?.message ||
          "Sai email hoặc mật khẩu / Không có quyền truy cập!";
        setBackendError(errorMsg);
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-96">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Đăng nhập
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
          <Form.Item
            label="Email"
            validateStatus={
              formik.touched.email && formik.errors.email ? "error" : ""
            }
            help={formik.touched.email && formik.errors.email}
          >
            <Input size="large" {...formik.getFieldProps("email")} />
          </Form.Item>

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
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={loading}
            className="bg-blue-600"
          >
            Đăng nhập
          </Button>
        </Form>
        <div className="text-center mt-4 text-sm text-gray-500">
          Chưa có tài khoản?{" "}
          <Link to="/auth/register" className="text-blue-600 font-medium">
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
