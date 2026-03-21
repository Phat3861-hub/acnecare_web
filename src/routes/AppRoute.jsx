import React, { Suspense, lazy } from "react";
import { useRoutes, Navigate } from "react-router-dom";
import { Spin } from "antd";

// ==========================================
// 1. ĐỊNH NGHĨA ĐƯỜNG DẪN (CHUẨN HÓA ABSOLUTE PATH)
// ==========================================
export const pathDefault = {
  home: "/",
  login: "/auth/login",
  register: "/auth/register",

  // Admin
  admin: "/admin",
  adminDashboard: "/admin/dashboard",
  manageUser: "/admin/manage-users",
  manageCategory: "/admin/manage-categories",
  manageProductAdmin: "/admin/manage-products",

  // Doctor
  doctor: "/doctor",
  doctorSchedule: "/doctor/schedule",
  doctorAppointmentDetail: "/doctor/schedule/:id",
  manageProductDoctor: "/doctor/manage-products",
  doctorAvailability: "/doctor/availability",
  testModelDoctor: "/doctor/test-model", // Đã bổ sung trang Test Model

  // Patient
  bookAppointment: "/book-appointment/:doctorId",
  appointmentSuccess: "/appointment-success",
  patientHistory: "/patient/history",
  appointmentDetail: "/patient/history/:id",
};

// ==========================================
// 2. LAZY LOAD LAYOUTS
// ==========================================
const PatientLayout = lazy(() => import("../templates/PatientLayout"));
const AdminLayout = lazy(() => import("../templates/AdminLayout"));
const DoctorLayout = lazy(() => import("../templates/DoctorLayout"));

// ==========================================
// 3. LAZY LOAD PAGES (CHỈ DÙNG LAZY, KHÔNG IMPORT TĨNH)
// ==========================================
// Auth
const Login = lazy(() => import("../pages/auth/Login"));
const Register = lazy(() => import("../pages/auth/Register"));

// Patient
const Home = lazy(() => import("../pages/patient/Home"));
const BookAppointment = lazy(() => import("../pages/patient/BookAppointment"));
const AppointmentSuccess = lazy(
  () => import("../pages/patient/AppointmentSuccess"),
);
const PatientHistory = lazy(() => import("../pages/patient/PatientHistory"));
const AppointmentDetail = lazy(
  () => import("../pages/patient/AppointmentDetail"),
);

// Admin
const AdminDashboard = lazy(() => import("../pages/admin/AdminDashboard"));
const ManageUser = lazy(() => import("../pages/admin/ManageUser"));
const ManageCategory = lazy(() => import("../pages/admin/ManageCategory"));

// Doctor
const DoctorSchedule = lazy(() => import("../pages/doctor/DoctorSchedule"));
const DoctorAppointmentDetail = lazy(
  () => import("../pages/doctor/DoctorAppointmentDetail"),
);
const ManageAvailability = lazy(
  () => import("../pages/doctor/ManageAvailability"),
);
const DoctorScanHistory = lazy(
  () => import("../pages/doctor/DoctorScanHistory"),
);
const DoctorConsultationService = lazy(
  () => import("../pages/doctor/DoctorConsultationService"),
);

// Shared (Dùng chung)
const ManageProduct = lazy(() => import("../pages/shared/ManageProduct"));
const TestAcneModel = lazy(() => import("../pages/shared/TestAcneModel"));

// Hiệu ứng Loading khi chuyển trang
const FallbackLoad = () => (
  <div className="flex justify-center items-center min-h-screen">
    <Spin size="large" />
  </div>
);

// ==========================================
// 4. CẤU HÌNH ROUTER
// ==========================================
const AppRoutes = () => {
  const arrRoutes = [
    // --- PATIENT ROUTES ---
    {
      path: pathDefault.home,
      element: (
        <Suspense fallback={<FallbackLoad />}>
          <PatientLayout />
        </Suspense>
      ),
      children: [
        {
          index: true,
          element: (
            <Suspense fallback={<FallbackLoad />}>
              <Home />
            </Suspense>
          ),
        },
        {
          path: pathDefault.bookAppointment,
          element: (
            <Suspense fallback={<FallbackLoad />}>
              <BookAppointment />
            </Suspense>
          ),
        },
        {
          path: pathDefault.appointmentSuccess,
          element: (
            <Suspense fallback={<FallbackLoad />}>
              <AppointmentSuccess />
            </Suspense>
          ),
        },
        {
          path: pathDefault.patientHistory,
          element: (
            <Suspense fallback={<FallbackLoad />}>
              <PatientHistory />
            </Suspense>
          ),
        },
        {
          path: pathDefault.appointmentDetail,
          element: (
            <Suspense fallback={<FallbackLoad />}>
              <AppointmentDetail />
            </Suspense>
          ),
        },
      ],
    },

    // --- AUTH ROUTES ---
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

    // --- ADMIN ROUTES ---
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
        {
          path: pathDefault.manageCategory,
          element: (
            <Suspense fallback={<FallbackLoad />}>
              <ManageCategory />
            </Suspense>
          ),
        },
        {
          path: pathDefault.manageProductAdmin,
          element: (
            <Suspense fallback={<FallbackLoad />}>
              <ManageProduct />
            </Suspense>
          ),
        },
      ],
    },

    // --- DOCTOR ROUTES ---
    {
      path: pathDefault.doctor,
      element: (
        <Suspense fallback={<FallbackLoad />}>
          <DoctorLayout />
        </Suspense>
      ),
      children: [
        {
          path: pathDefault.doctorSchedule,
          element: (
            <Suspense fallback={<FallbackLoad />}>
              <DoctorSchedule />
            </Suspense>
          ),
        },
        {
          path: pathDefault.doctorAppointmentDetail,
          element: (
            <Suspense fallback={<FallbackLoad />}>
              <DoctorAppointmentDetail />
            </Suspense>
          ),
        },
        {
          path: pathDefault.manageProductDoctor,
          element: (
            <Suspense fallback={<FallbackLoad />}>
              <ManageProduct />
            </Suspense>
          ),
        },
        {
          path: pathDefault.doctorAvailability,
          element: (
            <Suspense fallback={<FallbackLoad />}>
              <ManageAvailability />
            </Suspense>
          ),
        },
        {
          path: pathDefault.testModelDoctor,
          element: (
            <Suspense fallback={<FallbackLoad />}>
              <TestAcneModel />
            </Suspense>
          ),
        },
        {
          path: "patient-history",
          element: (
            <Suspense fallback={<FallbackLoad />}>
              <DoctorScanHistory />
            </Suspense>
          ),
        },
        {
          path: "consultation-services",
          element: (
            <Suspense fallback={<FallbackLoad />}>
              <DoctorConsultationService />
            </Suspense>
          ),
        },
      ],
    },

    // --- 404 NOT FOUND ---
    {
      path: "*",
      element: (
        <div className="flex justify-center min-h-screen items-center">
          <h1 className="text-2xl text-gray-500 font-bold">
            404 - Không tìm thấy trang
          </h1>
        </div>
      ),
    },
  ];

  return useRoutes(arrRoutes);
};

export default AppRoutes;
