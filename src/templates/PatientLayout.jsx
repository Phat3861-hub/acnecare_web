import React from "react";
import { Layout, Menu } from "antd";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../store/slice/UserSlice";

const { Header, Content, Footer } = Layout;

const PatientLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);

  return (
    <Layout className="min-h-screen">
      <Header className="bg-white flex justify-between items-center shadow-sm px-10">
        <div className="text-blue-600 font-bold text-2xl">ACNECARE</div>
        <div className="flex gap-4 items-center">
          <Link to="/" className="text-gray-600 hover:text-blue-600">
            Trang chủ
          </Link>
          <Link to="/products" className="text-gray-600 hover:text-blue-600">
            Sản phẩm
          </Link>
          <Link
            to="/patient/history"
            className="text-gray-600 hover:text-blue-600"
          >
            Lịch sử khám
          </Link>
          <Link to="/routine-builder">Thiết kế Routine</Link>
          <Link to="/my-routines">My Routines</Link>
          {user ? (
            <button
              onClick={() => {
                dispatch(logout());
                navigate("/auth/login");
              }}
              className="text-red-500"
            >
              Đăng xuất ({user.username})
            </button>
          ) : (
            <Link
              to="/auth/login"
              className="bg-blue-600 text-white px-4 py-1.5 rounded-md"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </Header>
      <Content className="p-10">
        <Outlet />
      </Content>
      <Footer className="text-center">AcneCare ©2026</Footer>
    </Layout>
  );
};

export default PatientLayout;
