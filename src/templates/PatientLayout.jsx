import React, { useEffect, useState } from "react";
import {
  Layout,
  Button,
  Dropdown,
  Drawer,
  Menu,
  ConfigProvider,
  Row,
  Col,
  Space,
  Typography,
} from "antd";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  UserOutlined,
  LogoutOutlined,
  UnorderedListOutlined,
  MessageOutlined,
  MenuOutlined,
  HomeOutlined,
  ScanOutlined,
  ShopOutlined,
  TeamOutlined,
  CalendarOutlined,
  BuildOutlined,
  FacebookOutlined,
  InstagramOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import { logoutUser } from "../store/slice/UserSlice";

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

const PatientLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.user);

  const [openDrawer, setOpenDrawer] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => {
    const userInfoStr = localStorage.getItem("userInfo");
    return user || (userInfoStr ? JSON.parse(userInfoStr) : null);
  });

  // MÀU THƯƠNG HIỆU ĐỒNG BỘ LOGO
  const BRAND_COLOR = "#8C52FF";

  useEffect(() => {
    setCurrentUser(user || JSON.parse(localStorage.getItem("userInfo")));
  }, [user]);

  const handleLogout = () => {
    dispatch(logoutUser());
    localStorage.removeItem("userInfo");
    localStorage.removeItem("token");
    navigate("/auth/login");
  };

  const navLinks = [
    { path: "/", label: "Trang chủ", icon: <HomeOutlined /> },
    { path: "/test-model", label: "Quét mụn", icon: <ScanOutlined /> },
    { path: "/products", label: "Sản phẩm", icon: <ShopOutlined /> },
    { path: "/posts", label: "Cộng đồng", icon: <TeamOutlined /> },
    {
      path: "/book-appointment",
      label: "Đặt lịch",
      icon: <CalendarOutlined />,
    },
    { path: "/routine-builder", label: "Routine", icon: <BuildOutlined /> },
  ];

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
      key: "history",
      icon: <UnorderedListOutlined />,
      label: "Lịch sử khám bệnh",
      onClick: () => navigate("/patient/history"),
    },
    {
      key: "chat",
      icon: <MessageOutlined style={{ color: BRAND_COLOR }} />,
      label: "Tin nhắn (Chat)",
      onClick: () => navigate("/chat"),
    },
    { type: "divider" },
    {
      key: "logout",
      icon: <LogoutOutlined className="text-red-500" />,
      label: <span className="text-red-500 font-medium">Đăng xuất</span>,
      onClick: handleLogout,
    },
  ];

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: BRAND_COLOR,
          borderRadius: 10,
        },
      }}
    >
      <Layout className="min-h-screen font-sans bg-[#fcfcfc]">
        {/* HEADER */}
        <Header className="bg-white flex justify-between items-center shadow-sm px-4 md:px-12 lg:px-24 h-20 sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <Button
              type="text"
              icon={<MenuOutlined className="text-xl" />}
              className="lg:hidden flex items-center justify-center"
              onClick={() => setOpenDrawer(true)}
            />

            {/* LOGO PATH: /acnecare_logo.png */}
            <div
              className="flex items-center cursor-pointer"
              onClick={() => navigate("/")}
            >
              <img
                src="/acnecare_logo.png"
                alt="acneCare Logo"
                className="h-10 md:h-12 w-auto object-contain"
              />
              <span
                className="ml-2 font-black text-2xl tracking-tighter hidden sm:inline-block"
                style={{ color: BRAND_COLOR }}
              >
                acneCare
              </span>
            </div>
          </div>

          {/* Navigation - Desktop */}
          <div className="hidden lg:flex gap-8 items-center text-[15px] font-semibold">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                style={{
                  color:
                    location.pathname === link.path ? BRAND_COLOR : "#64748b",
                }}
                className="hover:text-[#8C52FF] transition-all"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center">
            {currentUser ? (
              <Dropdown
                menu={{ items: userMenuItems }}
                trigger={["click"]}
                placement="bottomRight"
              >
                <div
                  className="flex items-center gap-2 text-white px-3 md:px-4 py-1.5 rounded-full cursor-pointer transition-all shadow-md text-sm font-bold"
                  style={{ backgroundColor: BRAND_COLOR }}
                >
                  <span className="hidden sm:inline">
                    Chào {currentUser.lastName || "bạn"}!
                  </span>
                  <div
                    className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0"
                    style={{ color: BRAND_COLOR }}
                  >
                    <UserOutlined />
                  </div>
                </div>
              </Dropdown>
            ) : (
              <Link
                to="/auth/login"
                className="flex items-center gap-2 bg-white border-2 px-5 py-1.5 rounded-full font-bold transition-all"
                style={{ color: BRAND_COLOR, borderColor: BRAND_COLOR }}
              >
                Đăng nhập
              </Link>
            )}
          </div>
        </Header>

        {/* MOBILE DRAWER */}
        <Drawer
          title={
            <div className="flex items-center gap-2">
              <img src="/acnecare_logo.png" alt="logo" className="h-8 w-auto" />
              <span
                style={{ color: BRAND_COLOR }}
                className="font-black text-xl"
              >
                acneCare
              </span>
            </div>
          }
          placement="left"
          onClose={() => setOpenDrawer(false)}
          open={openDrawer}
          width={280}
        >
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            onClick={() => setOpenDrawer(false)}
            className="border-none"
          >
            {navLinks.map((link) => (
              <Menu.Item key={link.path} icon={link.icon}>
                <Link to={link.path}>{link.label}</Link>
              </Menu.Item>
            ))}
          </Menu>
        </Drawer>

        {/* MAIN CONTENT */}
        <Content>
          <Outlet />
        </Content>

        {/* FOOTER */}
        <Footer className="bg-[#0f112a] text-white pt-16 pb-8 px-4 md:px-12 lg:px-24">
          <div className="max-w-7xl mx-auto">
            <Row gutter={[32, 40]}>
              <Col xs={24} md={9}>
                <div className="flex items-center gap-2 mb-6">
                  <img src="/acnecare_logo.png" alt="logo" className="h-10  " />
                  <span className="font-black text-2xl text-white tracking-tighter">
                    acneCare
                  </span>
                </div>
                <p className="text-gray-400 text-[15px] leading-relaxed pr-8">
                  Nền tảng ứng dụng Trí tuệ nhân tạo thế hệ mới, hỗ trợ theo dõi
                  tình trạng da mụn và kết nối nhanh chóng với các chuyên gia y
                  tế chuyên nghiệp.
                </p>
                <Space size="middle" className="mt-4">
                  <Button
                    shape="circle"
                    icon={<FacebookOutlined />}
                    className="bg-[#1e2044] border-none text-white hover:bg-[#8C52FF]"
                  />
                  <Button
                    shape="circle"
                    icon={<InstagramOutlined />}
                    className="bg-[#1e2044] border-none text-white hover:bg-[#8C52FF]"
                  />
                </Space>
              </Col>

              <Col xs={12} md={5}>
                <Title
                  level={5}
                  className="!text-white mb-6 uppercase tracking-widest text-sm"
                >
                  Dịch vụ
                </Title>
                <ul className="list-none p-0 flex flex-col gap-3 font-medium">
                  <li>
                    <Link
                      to="/test-model"
                      className="text-gray-400 hover:text-[#8C52FF]"
                    >
                      Phân tích da AI
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/book-appointment"
                      className="text-gray-400 hover:text-[#8C52FF]"
                    >
                      Đặt lịch bác sĩ
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/products"
                      className="text-gray-400 hover:text-[#8C52FF]"
                    >
                      Cửa hàng mỹ phẩm
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/posts"
                      className="text-gray-400 hover:text-[#8C52FF]"
                    >
                      Blog chia sẻ
                    </Link>
                  </li>
                </ul>
              </Col>

              <Col xs={24} md={10}>
                <Title
                  level={5}
                  className="!text-white mb-6 uppercase tracking-widest text-sm"
                >
                  Liên hệ
                </Title>
                <div className="flex flex-col gap-4 text-gray-400 font-medium">
                  <div className="flex gap-3">
                    <EnvironmentOutlined
                      style={{ color: BRAND_COLOR, fontSize: "18px" }}
                    />
                    <span>
                      HUTECH University - Khu Công nghệ cao, TP. Thủ Đức, TP. Hồ
                      Chí Minh
                    </span>
                  </div>
                  <div className="flex gap-3 items-center">
                    <MailOutlined
                      style={{ color: BRAND_COLOR, fontSize: "18px" }}
                    />
                    <span>contact@acnecare.io.vn</span>
                  </div>
                  <div className="flex gap-3 items-center">
                    <PhoneOutlined
                      style={{ color: BRAND_COLOR, fontSize: "18px" }}
                    />
                    <span>+84 (028) 5445 7777</span>
                  </div>
                </div>
              </Col>
            </Row>

            <div className="text-center text-gray-500 text-xs mt-16 pt-8 border-t border-gray-800/60">
              <p>
                Bản quyền © {new Date().getFullYear()} acneCare Team. All Rights
                Reserved.
              </p>
            </div>
          </div>
        </Footer>
      </Layout>
    </ConfigProvider>
  );
};

export default PatientLayout;
