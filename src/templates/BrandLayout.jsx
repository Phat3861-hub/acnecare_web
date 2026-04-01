import React, { useState } from "react";
import { Layout, Menu, Dropdown, Button } from "antd";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import {
  AppstoreOutlined,
  ProfileOutlined,
  UserOutlined,
  LogoutOutlined,
  MessageOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../store/slice/UserSlice";

const { Header, Sider, Content } = Layout;

const BrandLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.user);
  const currentUser = user || JSON.parse(localStorage.getItem("userInfo"));

  const handleLogout = () => {
    dispatch(logoutUser());
    localStorage.removeItem("userInfo");
    navigate("/auth/login");
  };

  const menuItems = [
    {
      key: "/brand/profile",
      icon: <ProfileOutlined />,
      label: "Hồ sơ Thương hiệu",
    },
    {
      key: "/brand/manage-products",
      icon: <AppstoreOutlined />,
      label: "Quản lý Sản phẩm",
    },
    {
      key: "/brand/chat",
      icon: <MessageOutlined />,
      label: <Link to="/brand/chat">Tin nhắn</Link>,
    },
    {
      key: "/brand/posts",
      icon: <TeamOutlined />,
      label: <Link to="/brand/posts">Cộng đồng</Link>,
    },
  ];

  return (
    <Layout className="min-h-screen font-sans">
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        className="bg-[#1e255e]"
        theme="dark"
      >
        <div className="h-16 flex items-center justify-center m-4 rounded-lg bg-white/10 overflow-hidden">
          <h1
            className={`text-white font-black transition-all ${collapsed ? "text-sm" : "text-xl"} m-0 tracking-tighter`}
          >
            {collapsed ? "aC" : "acneCare"}
          </h1>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          onClick={(e) => navigate(e.key)}
          items={menuItems}
          className="bg-transparent"
        />
      </Sider>
      <Layout>
        <Header className="bg-white px-6 flex justify-between items-center shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 m-0">
            Trang chủ Thương Hiệu
          </h2>
          <Dropdown
            menu={{
              items: [
                {
                  key: "logout",
                  icon: <LogoutOutlined className="text-red-500" />,
                  label: <span className="text-red-500">Đăng xuất</span>,
                  onClick: handleLogout,
                },
              ],
            }}
            trigger={["click"]}
          >
            <Button type="text" className="flex items-center gap-2 h-auto py-1">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <UserOutlined />
              </div>
              <span className="font-medium text-gray-700 hidden sm:block">
                {currentUser?.name || "Brand"}
              </span>
            </Button>
          </Dropdown>
        </Header>
        <Content className="m-6 p-6 bg-white rounded-xl shadow-sm min-h-[280px]">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default BrandLayout;
