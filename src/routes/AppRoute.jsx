import React, { Suspense, lazy } from "react";
import { useRoutes, Navigate } from "react-router-dom";
import { Spin } from "antd";

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
  manageProductDoctor: "/doctor/manage-products",

  // Brand
  // brand: "/brand",
  // manageProductBrand: "/brand/manage-products",

  //Patient
  bookAppointment: "/book-appointment/:doctorId",
  appointmentSuccess: "/appointment-success",
};

// Layouts
const PatientLayout = lazy(() => import("../templates/PatientLayout"));
const AdminLayout = lazy(() => import("../templates/AdminLayout"));
const DoctorLayout = lazy(() => import("../templates/DoctorLayout"));
// const BrandLayout = lazy(() => import("../templates/BrandLayout")); // Bạn nhớ tạo file này nhé

// Auth Pages
const Login = lazy(() => import("../pages/auth/Login"));
const Register = lazy(() => import("../pages/auth/Register"));

// Patient Pages
const Home = lazy(() => import("../pages/patient/Home"));
const BookAppointment = lazy(() => import("../pages/patient/BookAppointment"));
const AppointmentSuccess = lazy(
  () => import("../pages/patient/AppointmentSuccess"),
);

// Admin Pages
const AdminDashboard = lazy(() => import("../pages/admin/AdminDashboard"));
const ManageUser = lazy(() => import("../pages/admin/ManageUser"));
const ManageCategory = lazy(() => import("../pages/admin/ManageCategory"));

// Shared Pages (Dùng chung cho Admin, Doctor, Brand)
const ManageProduct = lazy(() => import("../pages/shared/ManageProduct"));
const FallbackLoad = () => (
  <div className="flex justify-center items-center min-h-screen">
    <Spin size="large" />
  </div>
);

const AppRoutes = () => {
  const arrRoutes = [
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
          path: "book-appointment/:doctorId",
          element: (
            <Suspense fallback={<FallbackLoad />}>
              <BookAppointment />
            </Suspense>
          ),
        },
        {
          path: "appointment-success",
          element: (
            <Suspense fallback={<FallbackLoad />}>
              <AppointmentSuccess />
            </Suspense>
          ),
        },
      ],
    },
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
          index: true,
          element: <Navigate to={pathDefault.doctorSchedule} replace />,
        },
        {
          path: pathDefault.doctorSchedule,
          element: (
            <Suspense fallback={<FallbackLoad />}>
              <doctorSchedule />
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
      ],
    },

    // --- BRAND ROUTES ---
    // {
    //   path: pathDefault.brand,
    //   element: (
    //     <Suspense fallback={<FallbackLoad />}>
    //       <BrandLayout />
    //     </Suspense>
    //   ),
    //   children: [
    //     {
    //       index: true,
    //       element: <Navigate to={pathDefault.manageProductBrand} replace />,
    //     },
    //     {
    //       path: pathDefault.manageProductBrand,
    //       element: (
    //         <Suspense fallback={<FallbackLoad />}>
    //           <ManageProduct />
    //         </Suspense>
    //       ),
    //     },
    //   ],
    // },

    {
      path: "*",
      element: (
        <div className="flex justify-center min-h-screen items-center">
          <h1>404 - Not Found</h1>
        </div>
      ),
    },
  ];

  return useRoutes(arrRoutes);
};

export default AppRoutes;
