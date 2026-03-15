import React from "react";
import { Layout, Menu } from "antd";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logoutUser } from "../store/slice/UserSlice";

const { Header, Sider, Content } = Layout;

const AdminLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logoutUser()).then(() => {
      navigate("/auth/login");
    });
  };

  return (
    <Layout className="min-h-screen">
      <Sider theme="dark">
        <div className="h-16 text-white text-xl font-bold flex items-center justify-center border-b border-gray-700">
          ADMIN PANEL
        </div>
        <Menu theme="dark" mode="inline" defaultSelectedKeys={["1"]}>
          <Menu.Item key="1">
            <Link to="/admin/dashboard">Dashboard</Link>
          </Menu.Item>
          <Menu.Item key="2">
            <Link to="/admin/manage-users">Quản lý Users</Link>
          </Menu.Item>
          <Menu.Item key="3">
            <Link to="/admin/manage-categories">Quản lý Categories</Link>
          </Menu.Item>
          <Menu.Item key="4">
            <Link to="/admin/manage-products">Quản lý Products</Link>
          </Menu.Item>
        </Menu>
      </Sider>
      <Layout>
        <Header className="bg-white px-6 flex justify-end items-center shadow-sm">
          <button
            onClick={handleLogout}
            className="text-red-500 font-medium hover:text-red-700"
          >
            Đăng xuất
          </button>
        </Header>
        <Content className="m-6 p-6 bg-white rounded-lg min-h-[280px]">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
