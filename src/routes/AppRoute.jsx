import React, { Suspense, lazy } from "react";
import { useRoutes, Navigate, Link } from "react-router-dom";
import { Spin, Button, Result } from "antd";
import ScrollToTop from "../components/ui/ScrollToTop"; // Đảm bảo bạn đã tạo file ScrollToTop như turn trước

// ==========================================
// 1. ĐỊNH NGHĨA ĐƯỜNG DẪN
// ==========================================
export const pathDefault = {
  home: "/",
  login: "/auth/login",
  register: "/auth/register",

  // Patient
  posts: "/posts",
  postDetail: "/posts/:id",
  createPost: "/createpost",
  bookAppointment: "/book-appointment", // Trang danh sách bác sĩ
  bookAppointmentDetail: "/book-appointment/:doctorId", // Form điền giờ đặt lịch
  appointmentSuccess: "/appointment-success",
  patientHistory: "/patient/history",
  appointmentDetail: "/patient/history/:id",
  products: "/products",
  productDetail: "/products/:id",

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
};

// ==========================================
// 2. COMPONENT BẢO VỆ ROUTE (PROTECTED ROUTE)
// ==========================================
const ProtectedRoute = ({ allowedRoles, children }) => {
  const userInfoStr = localStorage.getItem("userInfo");
  const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
  const userRole = userInfo ? userInfo.role : null;

  let homePath = pathDefault.home;
  if (userRole === "ADMIN") homePath = pathDefault.adminDashboard;
  else if (userRole === "DOCTOR") homePath = pathDefault.doctorSchedule;

  if (!userInfo) {
    return <Navigate to={pathDefault.login} replace />;
  }

  if (
    allowedRoles &&
    allowedRoles.length > 0 &&
    !allowedRoles.includes(userRole)
  ) {
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
                Về Bảng Điều Khiển
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
  const userInfoStr = localStorage.getItem("userInfo");
  const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
  const userRole = userInfo ? userInfo.role : null;

  let homePath = pathDefault.home;
  if (userRole === "ADMIN") homePath = pathDefault.adminDashboard;
  else if (userRole === "DOCTOR") homePath = pathDefault.doctorSchedule;

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
const DoctorList = lazy(() => import("../pages/patient/DoctorList")); // Component Danh sách Bác sĩ
const BookAppointment = lazy(() => import("../pages/patient/BookAppointment")); // Form đặt lịch
const AppointmentSuccess = lazy(
  () => import("../pages/patient/AppointmentSuccess"),
);
const PatientHistory = lazy(() => import("../pages/patient/PatientHistory"));
const AppointmentDetail = lazy(
  () => import("../pages/patient/AppointmentDetail"),
);
const MyRoutines = lazy(() => import("../pages/patient/MyRoutines"));
const RoutineBuilder = lazy(() => import("../pages/patient/RoutineBuilder"));
const ProductList = lazy(() => import("../pages/patient/ProductList"));
const ProductDetail = lazy(() => import("../pages/patient/ProductDetail"));

// Posts
const PostPage = lazy(() => import("../pages/posts/Post"));
const PostCommentPage = lazy(() => import("../pages/posts/PostComment"));
const CreatePostPage = lazy(() => import("../pages/posts/CreatePost"));
const EditPostPage = lazy(() => import("../pages/posts/EditPost"));

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
    {
      path: pathDefault.home,
      element: (
        <Suspense fallback={<FallbackLoad />}>
          <PatientLayout />
        </Suspense>
      ),
      children: [
        // 🟢 CÁC TRANG PUBLIC
        {
          index: true,
          element: (
            <Suspense fallback={<FallbackLoad />}>
              <Home />
            </Suspense>
          ),
        },
        {
          path: pathDefault.posts,
          element: (
            <Suspense fallback={<FallbackLoad />}>
              <PostPage />
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
          path: pathDefault.products,
          element: (
            <Suspense fallback={<FallbackLoad />}>
              <ProductList />
            </Suspense>
          ),
        },
        {
          path: pathDefault.productDetail,
          element: (
            <Suspense fallback={<FallbackLoad />}>
              <ProductDetail />
            </Suspense>
          ),
        },

        // 🔴 CÁC TRANG BẮT BUỘC ĐĂNG NHẬP (PATIENT)
        {
          path: pathDefault.bookAppointment, // Trỏ đến trang Danh sách bác sĩ
          element: (
            <ProtectedRoute allowedRoles={["PATIENT"]}>
              <Suspense fallback={<FallbackLoad />}>
                <DoctorList />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: pathDefault.bookAppointmentDetail, // Trỏ đến Form đặt lịch chi tiết của 1 bác sĩ
          element: (
            <ProtectedRoute allowedRoles={["PATIENT"]}>
              <Suspense fallback={<FallbackLoad />}>
                <BookAppointment />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: pathDefault.appointmentSuccess,
          element: (
            <ProtectedRoute allowedRoles={["PATIENT"]}>
              <Suspense fallback={<FallbackLoad />}>
                <AppointmentSuccess />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: pathDefault.patientHistory,
          element: (
            <ProtectedRoute allowedRoles={["PATIENT"]}>
              <Suspense fallback={<FallbackLoad />}>
                <PatientHistory />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: pathDefault.appointmentDetail,
          element: (
            <ProtectedRoute allowedRoles={["PATIENT"]}>
              <Suspense fallback={<FallbackLoad />}>
                <AppointmentDetail />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: "routine-builder",
          element: (
            <ProtectedRoute allowedRoles={["PATIENT"]}>
              <Suspense fallback={<FallbackLoad />}>
                <RoutineBuilder />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: "my-routines",
          element: (
            <ProtectedRoute allowedRoles={["PATIENT"]}>
              <Suspense fallback={<FallbackLoad />}>
                <MyRoutines />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: pathDefault.createPost,
          element: (
            <ProtectedRoute allowedRoles={["PATIENT", "DOCTOR", "ADMIN"]}>
              <Suspense fallback={<FallbackLoad />}>
                <CreatePostPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: "/editpost/:postId",
          element: (
            <ProtectedRoute allowedRoles={["PATIENT", "DOCTOR", "ADMIN"]}>
              <Suspense fallback={<FallbackLoad />}>
                <EditPostPage />
              </Suspense>
            </ProtectedRoute>
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

  const routing = useRoutes(arrRoutes);

  return (
    <>
      <ScrollToTop />
      {routing}
    </>
  );
};

export default AppRoutes;
