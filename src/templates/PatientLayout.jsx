import React, { useEffect, useState } from "react";
import { Layout, Input, Button, Dropdown } from "antd";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  UserOutlined,
  LogoutOutlined,
  UnorderedListOutlined,
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
      onClick: () => navigate("/profile"),
    },
    {
      key: "my-routines",
      icon: <UnorderedListOutlined />,
      label: "Lịch trình của tôi",
      onClick: () => navigate("/my-routines"),
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

          {/* NÚT NÀY BÂY GIỜ SẼ DẪN ĐẾN DANH SÁCH BÁC SĨ TRƯỚC */}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          <div>
            <div className="text-2xl font-bold tracking-tighter mb-4">
              acneCare
            </div>
            <p className="text-gray-400 text-sm leading-relaxed pr-10">
              Nền tảng ứng dụng trí tuệ nhân tạo giúp phân tích tình trạng mụn,
              kết nối bác sĩ da liễu và đồng hành cùng bạn trên hành trình chăm
              sóc da.
            </p>
          </div>

          <div className="flex gap-16">
            <div>
              <h4 className="text-white font-semibold mb-4">Về acneCare</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li>
                  <Link to="#" className="hover:text-white">
                    Trung tâm trợ giúp
                  </Link>
                </li>
                <li>
                  <Link to="#" className="hover:text-white">
                    Điều khoản sử dụng
                  </Link>
                </li>
                <li>
                  <Link to="#" className="hover:text-white">
                    Chính sách bảo mật
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">
                Kết nối chúng tôi
              </h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li>
                  <Link to="#" className="hover:text-white">
                    Facebook
                  </Link>
                </li>
                <li>
                  <Link to="#" className="hover:text-white">
                    Instagram
                  </Link>
                </li>
                <li>
                  <Link to="#" className="hover:text-white">
                    Email hỗ trợ
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-400 mb-4">
              Đăng ký nhận bản tin của chúng tôi để cập nhật những thông tin mới
              nhất.
            </p>
            <div className="flex">
              <Input
                placeholder="Nhập email của bạn"
                className="rounded-l-md rounded-r-none bg-transparent border-gray-500 text-white placeholder-gray-500 focus:border-blue-500 hover:border-blue-500"
              />
              <Button
                type="primary"
                className="rounded-l-none rounded-r-md bg-[#0099ff] border-none font-medium px-6"
              >
                Đăng ký
              </Button>
            </div>
          </div>
        </div>
        <div className="text-center text-gray-500 text-xs pt-8 border-t border-gray-700/50">
          Bản quyền © acneCare
        </div>
      </Footer>
    </Layout>
  );
};

export default PatientLayout;
