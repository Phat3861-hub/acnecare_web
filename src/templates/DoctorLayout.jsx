import React from "react";
import { Layout, Menu } from "antd";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logoutUser } from "../store/slice/UserSlice";

const { Header, Sider, Content } = Layout;

const DoctorLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation(); // Hook lấy đường dẫn hiện tại để highlight menu

  const handleLogout = () => {
    dispatch(logoutUser()).then(() => {
      navigate("/auth/login");
    });
  };

  // Cấu trúc Menu chuẩn Ant Design v5 (Dùng mảng items thay vì thẻ con Menu.Item)
  const menuItems = [
    {
      key: "/doctor/schedule",
      label: <Link to="/doctor/schedule">Lịch khám</Link>,
    },
    {
      key: "/doctor/manage-products",
      label: <Link to="/doctor/manage-products">Quản lý sản phẩm</Link>,
    },
    {
      key: "/doctor/test-model",
      label: <Link to="/doctor/test-model">Kiểm tra mô hình</Link>,
    },
    {
      key: "/doctor/availability",
      label: <Link to="/doctor/availability">Quản lý thời gian rảnh</Link>,
    },
    {
      key: "/doctor/patient-history",
      label: <Link to="/doctor/patient-history">Hồ sơ bệnh nhân</Link>,
    },
    {
      key: "/doctor/consultation-services",
      label: <Link to="/doctor/consultation-services">Quản lý dịch vụ</Link>,
    },
  ];

  return (
    <Layout className="min-h-screen">
      <Sider theme="light" className="shadow-md">
        <div className="h-16 text-blue-600 text-xl font-bold flex items-center justify-center border-b">
          DOCTOR PORTAL
        </div>
        <Menu
          mode="inline"
          // Tự động highlight đúng menu dựa vào URL hiện tại thay vì hardcode "1"
          selectedKeys={[location.pathname]}
          items={menuItems}
        />
      </Sider>

      <Layout>
        <Header className="bg-white px-6 flex justify-end items-center shadow-sm">
          <button
            onClick={handleLogout}
            className="text-red-500 font-medium hover:text-red-700 transition-colors"
          >
            Đăng xuất
          </button>
        </Header>
        <Content className="m-6 bg-white p-6 rounded-lg shadow-sm">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default DoctorLayout;
