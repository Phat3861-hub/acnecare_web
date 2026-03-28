import React, { useState, useEffect } from "react";
import { Layout, Menu, Drawer, Button } from "antd";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logoutUser } from "../store/slice/UserSlice";
import {
  MenuOutlined,
  DashboardOutlined,
  UserOutlined,
  AppstoreOutlined,
  ShoppingOutlined,
  LogoutOutlined,
} from "@ant-design/icons";

const { Header, Sider, Content } = Layout;

const AdminLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // State quản lý việc mở/đóng Drawer (Offcanvas) trên Mobile
  const [drawerVisible, setDrawerVisible] = useState(false);

  const handleLogout = () => {
    dispatch(logoutUser()).then(() => {
      navigate("/auth/login");
    });
  };

  // Tự động đóng Drawer khi click chọn link chuyển trang trên điện thoại
  useEffect(() => {
    setDrawerVisible(false);
  }, [location.pathname]);

  // Cấu hình danh sách Menu dùng chung cho cả Desktop và Mobile
  const menuItems = [
    {
      key: "/admin/dashboard",
      icon: <DashboardOutlined />,
      label: <Link to="/admin/dashboard">Dashboard</Link>,
    },
    {
      key: "/admin/manage-users",
      icon: <UserOutlined />,
      label: <Link to="/admin/manage-users">Quản lý Users</Link>,
    },
    {
      key: "/admin/manage-categories",
      icon: <AppstoreOutlined />,
      label: <Link to="/admin/manage-categories">Quản lý Categories</Link>,
    },
    {
      key: "/admin/manage-products",
      icon: <ShoppingOutlined />,
      label: <Link to="/admin/manage-products">Quản lý Products</Link>,
    },
  ];

  return (
    <Layout className="min-h-screen bg-gray-100">
      {/* ========================================================= */}
      {/* 1. SIDEBAR (CHỈ HIỂN THỊ TRÊN DESKTOP) */}
      {/* ========================================================= */}
      <Sider
        theme="dark"
        width={260}
        className="hidden md:block"
        style={{
          overflow: "auto",
          height: "100vh",
          position: "fixed", // Cố định Sider
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div className="h-16 text-white text-xl font-bold flex items-center justify-center border-b border-gray-700 sticky top-0 bg-[#001529] z-10">
          ADMIN PANEL
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
        />
      </Sider>

      {/* ========================================================= */}
      {/* 2. OFFCANVAS DRAWER (CHỈ HIỂN THỊ TRÊN MOBILE) */}
      {/* ========================================================= */}
      <Drawer
        title={
          <span className="font-bold text-lg text-gray-800">ADMIN PANEL</span>
        }
        placement="left"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={260}
        bodyStyle={{ padding: 0 }}
        className="md:hidden"
      >
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          className="border-r-0"
        />
      </Drawer>

      {/* ========================================================= */}
      {/* 3. MAIN CONTENT AREA (Đẩy sang phải 260px trên Desktop) */}
      {/* ========================================================= */}
      <Layout className="md:ml-[260px] transition-all duration-300">
        {/* HEADER CỐ ĐỊNH PHÍA TRÊN (STICKY) */}
        <Header className="bg-white px-4 md:px-6 flex justify-between md:justify-end items-center shadow-sm sticky top-0 z-50 p-0 w-full h-16">
          {/* Nút Hamburger hiện trên Mobile để mở Drawer */}
          <Button
            type="text"
            icon={<MenuOutlined className="text-lg" />}
            onClick={() => setDrawerVisible(true)}
            className="md:hidden flex items-center justify-center"
          />

          {/* Nút Đăng xuất */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-500 font-medium hover:text-red-700 transition-colors"
          >
            <LogoutOutlined />
            <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        </Header>

        {/* NỘI DUNG SCROLL ĐƯỢC */}
        <Content className="m-4 md:m-6 p-4 md:p-6 bg-white rounded-xl shadow-sm min-h-[280px]">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
