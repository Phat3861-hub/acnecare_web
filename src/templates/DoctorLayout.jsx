import React from "react";
import { Layout, Menu } from "antd";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../store/slice/UserSlice";

const { Header, Sider, Content } = Layout;

const DoctorLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  return (
    <Layout className="min-h-screen">
      <Sider theme="light" className="shadow-md">
        <div className="h-16 text-blue-600 text-xl font-bold flex items-center justify-center border-b">
          DOCTOR PORTAL
        </div>
        <Menu mode="inline" defaultSelectedKeys={["1"]}>
          <Menu.Item key="1">
            <Link to="/doctor/schedule">Lịch khám</Link>
          </Menu.Item>
        </Menu>
      </Sider>
      <Layout>
        <Header className="bg-white px-6 flex justify-end shadow-sm">
          <button
            onClick={() => {
              dispatch(logout());
              navigate("/auth/login");
            }}
            className="text-red-500"
          >
            Đăng xuất
          </button>
        </Header>
        <Content className="m-6 bg-white p-6 rounded-lg">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default DoctorLayout;
