import React, { Suspense, lazy } from "react";
import { useRoutes, Navigate, Link } from "react-router-dom";
import { Spin, Button, Result } from "antd";
import { jwtDecode } from "jwt-decode"; // Thêm thư viện giải mã token

// ==========================================
// 1. ĐỊNH NGHĨA ĐƯỜNG DẪN
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
  doctorProfile: "/doctor/profile",
  testModelDoctor: "/doctor/test-model",

  // Patient
  bookAppointment: "/book-appointment/:doctorId",
  appointmentSuccess: "/appointment-success",
  patientHistory: "/patient/history",
  appointmentDetail: "/patient/history/:id",

  posts: "/posts",
  postDetail: "/posts/:postId",
  createPost: "/createpost", // ĐÃ SỬA: Đổi chữ editpost thành createPost
};

// ==========================================
// 2. COMPONENT BẢO VỆ ROUTE (PROTECTED ROUTE)
// ==========================================
const ProtectedRoute = ({ allowedRoles, children }) => {
  const token = localStorage.getItem("accessToken");
  let userRole = null;
  let homePath = pathDefault.home; // Mặc định là trang chủ Patient

  if (token) {
    try {
      const decoded = jwtDecode(token);
      const tokenRoles = decoded.roles || decoded.scope || "";
      if (tokenRoles.includes("ADMIN")) {
        userRole = "ADMIN";
        homePath = pathDefault.adminDashboard;
      } else if (tokenRoles.includes("DOCTOR")) {
        userRole = "DOCTOR";
        homePath = pathDefault.doctorSchedule;
      } else if (tokenRoles.includes("BRAND")) {
        userRole = "BRAND";
        // homePath = "/brand/dashboard"; // Bổ sung nếu bạn có brand
      } else {
        userRole = "PATIENT";
      }
    } catch (error) {
      console.error("Token không hợp lệ", error);
    }
  }

  // 1. Chưa đăng nhập
  if (!token) {
    return <Navigate to={pathDefault.login} replace />;
  }

  // 2. Không đủ quyền (Lỗi 403)
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Result
          status="403"
          title={<span className="text-4xl font-black text-gray-800">403</span>}
          subTitle={
            <span className="text-lg text-gray-500">
              Xin lỗi, bạn không có quyền truy cập vào khu vực này!
            </span>
          }
          extra={
            <Link to={homePath}>
              <Button type="primary" size="large" className="bg-blue-600">
                Về Trang Bảng Điều Khiển
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  return children;
};
// ==========================================
// COMPONENT 404 THÔNG MINH
// ==========================================
const NotFoundPage = () => {
  const token = localStorage.getItem("accessToken");
  let homePath = pathDefault.home;

  if (token) {
    try {
      const decoded = jwtDecode(token);
      const tokenRoles = decoded.roles || decoded.scope || "";
      if (tokenRoles.includes("ADMIN")) homePath = pathDefault.adminDashboard;
      else if (tokenRoles.includes("DOCTOR"))
        homePath = pathDefault.doctorSchedule;
      // else if (tokenRoles.includes("BRAND")) homePath = "/brand/dashboard";
    } catch (error) {
      // Bỏ qua lỗi, dùng homePath mặc định
    }
  }

  return (
    <div className="flex flex-col justify-center min-h-screen items-center bg-gray-50">
      <Result
        status="404"
        title="404"
        subTitle="Trang bạn tìm kiếm không tồn tại hoặc đã bị xóa."
        extra={
          <Link to={homePath}>
            <Button type="primary" size="large" className="bg-blue-600">
              Quay lại Bảng Điều Khiển
            </Button>
          </Link>
        }
      />
    </div>
  );
};
// ==========================================
// 3. LAZY LOAD LAYOUTS & PAGES
// ==========================================
const PatientLayout = lazy(() => import("../templates/PatientLayout"));
const AdminLayout = lazy(() => import("../templates/AdminLayout"));
const DoctorLayout = lazy(() => import("../templates/DoctorLayout"));

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
const MyRoutines = lazy(() => import("../pages/patient/MyRoutines"));
const RoutineBuilder = lazy(() => import("../pages/patient/RoutineBuilder"));

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
const DoctorProfile = lazy(() => import("../pages/doctor/DoctorProfile"));

// Shared
const ManageProduct = lazy(() => import("../pages/shared/ManageProduct"));
const TestAcneModel = lazy(() => import("../pages/shared/TestAcneModel"));

const PostPage = lazy(() => import("../pages/posts/Post"));
const PostCommentPage = lazy(() => import("../pages/posts/PostComment"));
const CreatePostPage = lazy(() => import("../pages/posts/CreatePost"));
const EditPostPage = lazy(() => import("../pages/posts/EditPost"));

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
      // Patient layout có thể yêu cầu đăng nhập với role PATIENT
      element: (
        <ProtectedRoute allowedRoles={["PATIENT"]}>
          <Suspense fallback={<FallbackLoad />}>
            <PatientLayout />
          </Suspense>
        </ProtectedRoute>
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
        {
          path: "routine-builder",
          element: (
            <Suspense fallback={<FallbackLoad />}>
              <RoutineBuilder />
            </Suspense>
          ),
        },
        // cái post này là dùng chung để tạm ở đây trước đã
        {
          path: pathDefault.posts,
          element: (
            <Suspense fallback={<FallbackLoad />}>
              <PostPage />
            </Suspense>
          ),
        },
        {
          path: "my-routines",
          element: (
            <Suspense fallback={<FallbackLoad />}>
              <MyRoutines />
            </Suspense>
          ),
        },
        {
          path: pathDefault.postDetail,
          element: (
            <Suspense fallback={<FallbackLoad />}>
              <PostCommentPage />
            </Suspense>
          ),
        },
        {
          path: pathDefault.createPost, // ĐÃ SỬA: dùng đúng biến tạo ở phần 1
          element: (
            <Suspense fallback={<FallbackLoad />}>
              <CreatePostPage />
            </Suspense>
          ),
        },
        {
          path: "/editpost/:postId",
          element: (
            <Suspense fallback={<FallbackLoad />}>
              <EditPostPage />
            </Suspense>
          ),
        },
      ],
    },

    // --- AUTH ROUTES (Không cần bảo vệ) ---
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
      // Khóa toàn bộ route con bằng ADMIN role
      element: (
        <ProtectedRoute allowedRoles={["ADMIN"]}>
          <Suspense fallback={<FallbackLoad />}>
            <AdminLayout />
          </Suspense>
        </ProtectedRoute>
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
      // Khóa toàn bộ route con bằng DOCTOR role
      element: (
        <ProtectedRoute allowedRoles={["DOCTOR"]}>
          <Suspense fallback={<FallbackLoad />}>
            <DoctorLayout />
          </Suspense>
        </ProtectedRoute>
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
        {
          path: "profile",
          element: (
            <Suspense fallback={<FallbackLoad />}>
              <DoctorProfile />
            </Suspense>
          ),
        },
      ],
    },

    // --- 404 NOT FOUND ---
    {
      path: "*",
      element: <NotFoundPage />,
    },
  ];

  return useRoutes(arrRoutes);
};

export default AppRoutes;
