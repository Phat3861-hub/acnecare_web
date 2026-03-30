import React, { useEffect, useState } from "react";
import { Layout, Input, Button, Dropdown } from "antd";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  UserOutlined,
  LogoutOutlined,
  UnorderedListOutlined,
  MessageOutlined, // Thêm Icon Chat
} from "@ant-design/icons";
import { logoutUser } from "../store/slice/UserSlice";

const { Header, Content, Footer } = Layout;

const PatientLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);

  const [currentUser, setCurrentUser] = useState(() => {
    if (user) return user;
    const userInfoStr = localStorage.getItem("userInfo");
    if (userInfoStr) {
      try {
        return JSON.parse(userInfoStr);
      } catch (err) {
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    setCurrentUser(user || JSON.parse(localStorage.getItem("userInfo")));
  }, [user]);

  const handleLogout = () => {
    dispatch(logoutUser());
    localStorage.removeItem("userInfo");
    navigate("/auth/login");
  };

  const userMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Thông tin cá nhân",
      onClick: () => navigate("/patient/profile"),
    },
    {
      key: "my-treatment-cases",
      icon: <UnorderedListOutlined />,
      label: "Ca điều trị của tôi",
      onClick: () => navigate("/my-treatment-cases"),
    },
    {
      key: "my-routines",
      icon: <UnorderedListOutlined />,
      label: "Lịch trình của tôi",
      onClick: () => navigate("/my-routines"),
    },
    {
      key: "chat",
      icon: <MessageOutlined className="text-blue-500" />,
      label: "Tin nhắn (Chat)",
      onClick: () => navigate("/chat"),
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

  return (
    <Layout className="min-h-screen font-sans">
      {/* HEADER */}
      <Header className="bg-white flex justify-between items-center shadow-sm px-4 md:px-12 lg:px-24 h-20 sticky top-0 z-50">
        <div
          className="text-[#2b307c] font-black text-2xl tracking-tighter cursor-pointer"
          onClick={() => navigate("/")}
        >
          acneCare
        </div>

        {/* Navigation Links */}
        <div className="hidden lg:flex gap-8 items-center text-[15px] font-medium">
          <Link to="/" className="text-[#2b307c] font-bold">
            Trang chủ
          </Link>
          <Link
            to="/test-model"
            className="text-gray-500 hover:text-[#2b307c] transition-colors"
          >
            Quét mụn
          </Link>
          <Link
            to="/products"
            className="text-gray-500 hover:text-[#2b307c] transition-colors"
          >
            Sản phẩm
          </Link>
          <Link
            to="/posts"
            className="text-gray-500 hover:text-[#2b307c] transition-colors"
          >
            Cộng đồng
          </Link>
          <Link
            to="/book-appointment"
            className="text-gray-500 hover:text-[#2b307c] transition-colors"
          >
            Đặt lịch
          </Link>
          <Link
            to="/routine-builder"
            className="text-gray-500 hover:text-[#2b307c] transition-colors"
          >
            Routine
          </Link>
          {/* NÚT CHAT TRÊN THANH ĐIỀU HƯỚNG */}
          {currentUser && (
            <Link
              to="/chat"
              className="text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-1"
            >
              <MessageOutlined /> Tin nhắn
            </Link>
          )}
        </div>

        {/* User Action */}
        <div className="flex items-center">
          {currentUser ? (
            <Dropdown
              menu={{ items: userMenuItems }}
              trigger={["click"]}
              placement="bottomRight"
            >
              <div className="flex items-center gap-2 bg-[#3b82f6] text-white px-4 py-1.5 rounded-full cursor-pointer hover:bg-blue-600 transition-colors shadow-md">
                <span className="text-sm font-medium">
                  Xin chào {currentUser.lastName || currentUser.name || "bạn"}!
                </span>
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-blue-500">
                  <UserOutlined />
                </div>
              </div>
            </Dropdown>
          ) : (
            <Link
              to="/auth/login"
              className="flex items-center gap-2 bg-white border border-gray-300 text-[#2b307c] pl-1 pr-5 py-1 rounded-full font-medium hover:border-[#2b307c] hover:shadow-md transition-all duration-300"
            >
              <div className="w-8 h-8 rounded-full bg-[#e0f0ff] flex items-center justify-center text-blue-600">
                <UserOutlined />
              </div>
              Đăng nhập
            </Link>
          )}
        </div>
      </Header>

      {/* CONTENT */}
      <Content className="bg-[#fcfcfc]">
        <Outlet />
      </Content>

      {/* FOOTER */}
      <Footer className="bg-[#2b2d5c] text-white py-12 px-4 md:px-12 lg:px-24">
        {/* Footer Content Giữ Nguyên */}
        <div className="text-center text-gray-500 text-xs pt-8 border-t border-gray-700/50">
          Bản quyền © acneCare
        </div>
      </Footer>
    </Layout>
  );
};

export default PatientLayout;
