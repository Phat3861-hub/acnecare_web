import React, { Suspense, lazy } from "react";
import { useRoutes, Navigate, Link } from "react-router-dom";
import { Spin, Button, Result } from "antd";
import ScrollToTop from "../components/ui/ScrollToTop";

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
  bookAppointment: "/book-appointment",
  bookAppointmentDetail: "/book-appointment/:doctorId",
  appointmentSuccess: "/appointment-success",
  patientHistory: "/patient/history",
  appointmentDetail: "/patient/history/:id",
  patientProfile: "/patient/profile",
  products: "/products",
  productDetail: "/products/:id",
  chat: "/chat",
  testModel: "/test-model",

  // Admin
  admin: "/admin",
  adminDashboard: "/admin/dashboard",
  manageUser: "/admin/manage-users",
  manageCategory: "/admin/manage-categories",
  manageProductAdmin: "/admin/manage-products",
  adminChat: "/admin/chat",

  // Doctor
  doctor: "/doctor",
  doctorSchedule: "/doctor/schedule",
  doctorAppointmentDetail: "/doctor/schedule/:id",
  manageProductDoctor: "/doctor/manage-products",
  doctorAvailability: "/doctor/availability",
  doctorProfile: "/doctor/profile",
  testModelDoctor: "/doctor/test-model",
  doctorChat: "/doctor/chat",

  // Brand
  brand: "/brand",
  brandProfile: "/brand/profile",
  manageProductBrand: "/brand/manage-products",
};

// ==========================================
// 2. COMPONENT BẢO VỆ ROUTE
// ==========================================
const ProtectedRoute = ({ allowedRoles, children }) => {
  const userInfoStr = localStorage.getItem("userInfo");
  const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
  const userRole = userInfo ? userInfo.role : null;

  let homePath = pathDefault.home;
  if (userRole === "ADMIN") homePath = pathDefault.adminDashboard;
  else if (userRole === "DOCTOR") homePath = pathDefault.doctorSchedule;
  else if (userRole === "BRAND") homePath = pathDefault.brandProfile;

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
          title="403"
          subTitle="Xin lỗi, bạn không có quyền truy cập vào khu vực này!"
          extra={
            <Link to={homePath}>
              <Button type="primary">Về Bảng Điều Khiển</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return children;
};

const NotFoundPage = () => {
  return <Result status="404" title="404" subTitle="Trang không tồn tại" />;
};

// ==========================================
// 3. LAZY LOAD COMPONENTS
// ==========================================
const PatientLayout = lazy(() => import("../templates/PatientLayout"));
const AdminLayout = lazy(() => import("../templates/AdminLayout"));
const DoctorLayout = lazy(() => import("../templates/DoctorLayout"));
const BrandLayout = lazy(() => import("../templates/BrandLayout"));

const Login = lazy(() => import("../pages/auth/Login"));
const Register = lazy(() => import("../pages/auth/Register"));

// Patient
const Home = lazy(() => import("../pages/patient/Home"));
const DoctorList = lazy(() => import("../pages/patient/DoctorList"));
const BookAppointment = lazy(() => import("../pages/patient/BookAppointment"));
const AppointmentSuccess = lazy(
  () => import("../pages/patient/AppointmentSuccess"),
);
const PatientHistory = lazy(() => import("../pages/patient/PatientHistory"));
const AppointmentDetail = lazy(
  () => import("../pages/patient/AppointmentDetail"),
);
const PatientProfile = lazy(() => import("../pages/patient/PatientProfile"));
const MyRoutines = lazy(() => import("../pages/patient/MyRoutines"));
const RoutineBuilder = lazy(() => import("../pages/patient/RoutineBuilder"));
const ProductList = lazy(() => import("../pages/patient/ProductList"));
const ProductDetail = lazy(() => import("../pages/patient/ProductDetail"));
const MyTreatmentCases = lazy(
  () => import("../pages/patient/MyTreatmentCases"),
);
const TreatmentCaseDetail = lazy(
  () => import("../pages/shared/TreatmentCaseDetail"),
);
const PostPage = lazy(() => import("../pages/posts/Post"));
const PostCommentPage = lazy(() => import("../pages/posts/PostComment"));
const CreatePostPage = lazy(() => import("../pages/posts/CreatePost"));
const EditPostPage = lazy(() => import("../pages/posts/EditPost"));

// Shared Chat Component
const ChatPage = lazy(() => import("../pages/shared/ChatPage"));

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
const DoctorTreatmentCases = lazy(
  () => import("../pages/doctor/DoctorTreatmentCases"),
);

// Brand
const BrandProfile = lazy(() => import("../pages/brand/BrandProfile"));
const ManageProduct = lazy(() => import("../pages/shared/ManageProduct"));
const TestAcneModel = lazy(() => import("../pages/shared/TestAcneModel"));

const FallbackLoad = () => (
  <div className="flex justify-center items-center min-h-screen">
    <Spin size="large" />
  </div>
);

// ==========================================
// 4. CẤU HÌNH ROUTER CHÍNH
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
        {
          path: pathDefault.bookAppointment,
          element: (
            <ProtectedRoute allowedRoles={["PATIENT"]}>
              <Suspense fallback={<FallbackLoad />}>
                <DoctorList />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: pathDefault.bookAppointmentDetail,
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
          path: pathDefault.patientProfile,
          element: (
            <ProtectedRoute allowedRoles={["PATIENT"]}>
              <Suspense fallback={<FallbackLoad />}>
                <PatientProfile />
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
        {
          path: "my-treatment-cases",
          element: (
            <ProtectedRoute allowedRoles={["PATIENT"]}>
              <Suspense fallback={<FallbackLoad />}>
                <MyTreatmentCases />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: "treatment-cases/:id",
          element: (
            <ProtectedRoute allowedRoles={["PATIENT", "DOCTOR"]}>
              <Suspense fallback={<FallbackLoad />}>
                <TreatmentCaseDetail />
              </Suspense>
            </ProtectedRoute>
          ),
        },

        // CHAT ROUTE CHO PATIENT
        {
          path: "chat",
          element: (
            <ProtectedRoute allowedRoles={["PATIENT"]}>
              <Suspense fallback={<FallbackLoad />}>
                <ChatPage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: "test-model",
          element: (
            <ProtectedRoute allowedRoles={["PATIENT"]}>
              <Suspense fallback={<FallbackLoad />}>
                <TestAcneModel />
              </Suspense>
            </ProtectedRoute>
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
        // CHAT ROUTE CHO ADMIN
        {
          path: "chat",
          element: (
            <Suspense fallback={<FallbackLoad />}>
              <ChatPage />
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
        {
          path: "treatment-cases",
          element: (
            <Suspense fallback={<FallbackLoad />}>
              <DoctorTreatmentCases />{" "}
            </Suspense>
          ),
        },
        {
          path: "treatment-cases/:id",
          element: (
            <Suspense fallback={<FallbackLoad />}>
              <TreatmentCaseDetail />
            </Suspense>
          ),
        },
        // CHAT ROUTE CHO DOCTOR
        {
          path: "chat",
          element: (
            <Suspense fallback={<FallbackLoad />}>
              <ChatPage />
            </Suspense>
          ),
        },
      ],
    },

    // --- BRAND ROUTES---
    {
      path: pathDefault.brand,
      element: (
        <ProtectedRoute allowedRoles={["BRAND"]}>
          <Suspense fallback={<FallbackLoad />}>
            <BrandLayout />
          </Suspense>
        </ProtectedRoute>
      ),
      children: [
        {
          index: true,
          element: <Navigate to={pathDefault.brandProfile} replace />,
        },
        {
          path: pathDefault.brandProfile,
          element: (
            <Suspense fallback={<FallbackLoad />}>
              <BrandProfile />
            </Suspense>
          ),
        },
        {
          path: pathDefault.manageProductBrand,
          element: (
            <Suspense fallback={<FallbackLoad />}>
              <ManageProduct />
            </Suspense>
          ),
        },
        // CHAT ROUTE CHO BRAND
        {
          path: "chat",
          element: (
            <Suspense fallback={<FallbackLoad />}>
              <ChatPage />
            </Suspense>
          ),
        },

        // 🚨 CHUỖI ROUTES CỘNG ĐỒNG CHO BRAND (ĐÃ CHUẨN HÓA PATH KHÔNG CÓ DẤU /)
        {
          path: "posts", // => /brand/posts
          element: (
            <Suspense fallback={<FallbackLoad />}>
              <PostPage />
            </Suspense>
          ),
        },
        {
          path: "posts/:id", // => /brand/posts/:id (Để xem chi tiết comment)
          element: (
            <Suspense fallback={<FallbackLoad />}>
              <PostCommentPage />
            </Suspense>
          ),
        },
        {
          path: "createpost", // => /brand/createpost
          element: (
            <Suspense fallback={<FallbackLoad />}>
              <CreatePostPage />
            </Suspense>
          ),
        },
        {
          path: "editpost/:postId", // => /brand/editpost/:postId (Đã bỏ dấu / ở đầu)
          element: (
            <Suspense fallback={<FallbackLoad />}>
              <EditPostPage />
            </Suspense>
          ),
        },
      ],
    },

    { path: "*", element: <NotFoundPage /> },
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
