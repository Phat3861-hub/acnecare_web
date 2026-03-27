import React, { useEffect, useState } from "react";
import { Layout, Menu, Button, Avatar, Dropdown } from "antd";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logoutUser } from "../store/slice/UserSlice";
import {
  CalendarOutlined,
  ShoppingOutlined,
  ExperimentOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  AppstoreOutlined,
  MenuOutlined,
  LogoutOutlined,
  UserOutlined,
  CloseOutlined,
} from "@ant-design/icons";

const { Header, Sider, Content } = Layout;

const DoctorLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Đặt mặc định là true (Đóng) trên Mobile
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    if (location.pathname === "/doctor" || location.pathname === "/doctor/") {
      navigate("/doctor/schedule", { replace: true });
    }
  }, [location.pathname, navigate]);

  const handleLogout = () => {
    dispatch(logoutUser()).then(() => {
      navigate("/auth/login");
    });
  };

  const userMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Thông tin cá nhân",
      onClick: () => navigate("/doctor/profile"),
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogoutOutlined className="text-red-500" />,
      label: <span className="text-red-500 font-medium">Đăng xuất</span>,
      onClick: handleLogout,
    },
  ];

  const menuItems = [
    {
      key: "/doctor/schedule",
      icon: <CalendarOutlined />,
      label: <Link to="/doctor/schedule">Lịch khám</Link>,
    },
    {
      key: "/doctor/manage-products",
      icon: <ShoppingOutlined />,
      label: <Link to="/doctor/manage-products">Quản lý sản phẩm</Link>,
    },
    {
      key: "/doctor/test-model",
      icon: <ExperimentOutlined />,
      label: <Link to="/doctor/test-model">Kiểm tra mô hình</Link>,
    },
    {
      key: "/doctor/availability",
      icon: <ClockCircleOutlined />,
      label: <Link to="/doctor/availability">Quản lý thời gian rảnh</Link>,
    },
    {
      key: "/doctor/patient-history",
      icon: <TeamOutlined />,
      label: <Link to="/doctor/patient-history">Hồ sơ bệnh nhân</Link>,
    },
    {
      key: "/doctor/consultation-services",
      icon: <AppstoreOutlined />,
      label: <Link to="/doctor/consultation-services">Quản lý dịch vụ</Link>,
    },
  ];

  // Hàm tự động đóng menu
  const handleMenuClick = () => {
    setCollapsed(true);
  };

  return (
    <Layout hasSider className="h-screen overflow-hidden bg-gray-50">
      {/* 1. LỚP PHỦ TỐI (OVERLAY) - Hiệu ứng mờ dần */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 lg:hidden transition-opacity duration-300 ease-in-out ${
          collapsed
            ? "opacity-0 pointer-events-none"
            : "opacity-100 pointer-events-auto"
        }`}
        onClick={() => setCollapsed(true)}
      />

      {/* 2. SIDER RESPONSIVE - Hiệu ứng trượt ngang (TranslateX) 60fps siêu mượt */}
      <Sider
        width={260}
        theme="light"
        // Force class Tailwind để xử lý animation, loại bỏ hiệu ứng cứng của Ant Design
        className={`shadow-2xl z-50 h-screen overflow-y-auto border-r border-gray-200 !fixed lg:!static left-0 top-0 bottom-0 transition-transform duration-300 ease-in-out ${
          collapsed ? "-translate-x-full lg:translate-x-0" : "translate-x-0"
        }`}
      >
        <div className="h-16 flex items-center justify-between border-b sticky top-0 bg-white z-10 px-4">
          <div className="text-blue-600 font-black text-xl tracking-wider truncate">
            DOCTOR PORTAL
          </div>

          {/* NÚT TẮT CHỈ HIỆN TRÊN MOBILE */}
          <Button
            type="text"
            icon={<CloseOutlined className="text-gray-600" />}
            onClick={() => setCollapsed(true)}
            className="lg:hidden flex items-center justify-center hover:bg-gray-100 rounded-full w-8 h-8"
          />
        </div>

        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          className="border-none mt-2 font-medium text-gray-600"
        />
      </Sider>

      {/* 3. CỘT CHÍNH (HEADER + CONTENT) */}
      <Layout className="flex flex-col h-screen overflow-hidden w-full relative">
        {/* HEADER */}
        <Header className="bg-white px-4 md:px-6 flex justify-between items-center shadow-sm shrink-0 z-10 border-b border-gray-200">
          {/* Nút Hamburger bật menu */}
          <Button
            type="text"
            icon={<MenuOutlined className="text-lg" />}
            onClick={() => setCollapsed(false)} // Bấm vào để mở menu
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 lg:hidden"
          />

          <div className="hidden lg:block font-semibold text-gray-700 text-lg">
            Bảng Điều Khiển
          </div>

          <Dropdown
            menu={{ items: userMenuItems }}
            trigger={["click"]}
            placement="bottomRight"
          >
            <div className="flex items-center gap-3 cursor-pointer p-1.5 rounded-full hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200">
              <Avatar
                size="large"
                className="bg-blue-600 shadow-sm"
                icon={<UserOutlined />}
              />
              <div className="hidden md:block">
                <div className="text-sm font-bold text-gray-800 leading-none">
                  Bác sĩ
                </div>
                <div className="text-xs text-gray-500 mt-1">Trực tuyến</div>
              </div>
            </div>
          </Dropdown>
        </Header>

        {/* KHU VỰC CONTENT */}
        <Content className="flex-1 overflow-y-auto bg-gray-50/50 p-4 md:p-6 lg:p-8 relative">
          <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 min-h-full transition-all">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default DoctorLayout;
