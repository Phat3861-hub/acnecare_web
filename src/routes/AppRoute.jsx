import React, { Suspense, lazy } from "react";
import { useRoutes, Navigate } from "react-router-dom";
import { Spin } from "antd";

// ==========================================
// 1. ĐỊNH NGHĨA PATH CONSTANTS (Giống như pathDefault của bạn)
// ==========================================
export const pathDefault = {
  home: "/",
  login: "/auth/login",
  register: "/auth/register",

  // Admin
  admin: "/admin",
  manageUser: "/admin/manage-users",
  adminDashboard: "/admin/dashboard",

  // Doctor
  doctor: "/doctor",
  doctorSchedule: "/doctor/schedule",
};

// ==========================================
// 2. LAZY LOADING COMPONENTS & LAYOUTS
// Lấy component từ file chỉ khi người dùng truy cập vào route đó
// ==========================================
// Layouts
const PatientLayout = lazy(() => import("../templates/PatientLayout"));
const AdminLayout = lazy(() => import("../templates/AdminLayout"));
const DoctorLayout = lazy(() => import("../templates/DoctorLayout"));

// Auth Pages
const Login = lazy(() => import("../pages/auth/Login"));
const Register = lazy(() => import("../pages/auth/Register"));

// Patient Pages
const Home = lazy(() => import("../pages/Home")); // Tạo tạm file Home.jsx nhé

// Admin Pages
const AdminDashboard = lazy(() => import("../pages/admin/AdminDashboard")); // Tạo tạm file
const ManageUser = lazy(() => import("../pages/admin/ManageUser")); // Bạn có nhắc đến file này

// Doctor Pages
const DoctorSchedule = lazy(() => import("../pages/doctor/DoctorSchedule")); // Tạo tạm file

// Component hiển thị trong lúc chờ tải file JS
const FallbackLoad = () => (
  <div className="flex justify-center items-center min-h-screen">
    <Spin size="large" />
  </div>
);

// ==========================================
// 3. CẤU HÌNH ROUTES BẰNG MẢNG
// ==========================================
const AppRoutes = () => {
  const arrRoutes = [
    // ----------------------
    // ROUTES CHO NGƯỜI DÙNG (PATIENT)
    // ----------------------
    {
      path: pathDefault.home,
      element: (
        <Suspense fallback={<FallbackLoad />}>
          <PatientLayout />
        </Suspense>
      ),
      children: [
        {
          index: true, // Route mặc định khi vào "/"
          element: (
            <Suspense fallback={<FallbackLoad />}>
              <Home />
            </Suspense>
          ),
        },
        // Thêm danh sách sản phẩm, chi tiết sản phẩm vào đây sau...
      ],
    },

    // ----------------------
    // ROUTES AUTH (ĐĂNG NHẬP / ĐĂNG KÝ)
    // ----------------------
    {
      path: pathDefault.login,
      element: (
        <Suspense fallback={<FallbackLoad />}>
          <Login />
        </Suspense>
      ),
    },
    {
      path: pathDefault.register,
      element: (
        <Suspense fallback={<FallbackLoad />}>
          <Register />
        </Suspense>
      ),
    },

    // ----------------------
    // ROUTES CHO ADMIN
    // ----------------------
    {
      path: pathDefault.admin,
      element: (
        <Suspense fallback={<FallbackLoad />}>
          <AdminLayout />
        </Suspense>
      ),
      children: [
        {
          index: true,
          element: <Navigate to={pathDefault.adminDashboard} replace />,
        },
        {
          path: pathDefault.adminDashboard,
          element: (
            <Suspense fallback={<FallbackLoad />}>
              <AdminDashboard />
            </Suspense>
          ),
        },
        {
          path: pathDefault.manageUser,
          element: (
            <Suspense fallback={<FallbackLoad />}>
              <ManageUser />
            </Suspense>
          ),
        },
      ],
    },

    // ----------------------
    // ROUTES CHO DOCTOR
    // ----------------------
    {
      path: pathDefault.doctor,
      element: (
        <Suspense fallback={<FallbackLoad />}>
          <DoctorLayout />
        </Suspense>
      ),
      children: [
        {
          index: true,
          element: <Navigate to={pathDefault.doctorSchedule} replace />,
        },
        {
          path: pathDefault.doctorSchedule,
          element: (
            <Suspense fallback={<FallbackLoad />}>
              <DoctorSchedule />
            </Suspense>
          ),
        },
      ],
    },

    // ----------------------
    // ROUTE 404 - KHÔNG TÌM THẤY TRANG
    // ----------------------
    {
      path: "*",
      element: (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-4xl font-bold text-gray-800">404</h1>
          <p className="text-gray-500">Không tìm thấy trang này!</p>
        </div>
      ),
    },
  ];

  // Sử dụng hook useRoutes để render mảng cấu hình thành các Route thực tế
  const routing = useRoutes(arrRoutes);

  return routing;
};

export default AppRoutes;
