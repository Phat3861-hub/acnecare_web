import React from "react";
import { useSelector } from "react-redux";
import { Card, Typography, Row, Col, Statistic, Space, Button } from "antd";
import {
  RocketOutlined,
  UsergroupAddOutlined,
  AppstoreAddOutlined,
  DollarCircleOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

const { Title, Text } = Typography;

const AdminDashboard = () => {
  const { user } = useSelector((state) => state.user);
  const navigate = useNavigate();

  // Thử lấy fallback từ localStorage
  let currentUserName = user?.name || user?.username;
  if (!currentUserName) {
    try {
      const userInfoStr = localStorage.getItem("userInfo");
      if (userInfoStr) {
        const userInfo = JSON.parse(userInfoStr);
        currentUserName = userInfo.name || userInfo.username;
      }
    } catch (e) {
      console.error(e);
    }
  }



  return (
    <div className="admin-dashboard-container">
      {/* Banner Chào Mừng */}
      <Card className="admin-welcome-banner border-none shadow-sm rounded-2xl mb-8 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl translate-y-1/2 -z-0"></div>
        
        <div className="relative z-10 p-4 sm:p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <Space direction="vertical" size="small" className="w-full text-center md:text-left text-white">
            <Title level={2} className="m-0 text-white drop-shadow-md">
              Xin chào, {currentUserName || "Admin"} 👋
            </Title>
            <Text className="text-white/90 text-sm sm:text-base font-medium">
              Chào mừng bạn quay trở lại. Hãy cùng xem tổng quan về hệ thống hôm nay nhé!
            </Text>
          </Space>
          
          <Button 
            type="primary" 
            size="large" 
            shape="round"
            className="bg-white/20 hover:bg-white/30 border border-white/40 text-white font-bold backdrop-blur-md shadow-lg"
            icon={<ArrowRightOutlined />}
            onClick={() => navigate("/admin/manage-users")}
          >
            Quản lý ngay
          </Button>
        </div>
      </Card>

      
      {/* Thêm một component minh họa nhỏ bên dưới nếu muốn */}
      <div className="mt-8 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center min-h-[250px] text-center">
        <div className="bg-blue-50 text-blue-500 p-4 rounded-full mb-4">
          <RocketOutlined className="text-4xl" />
        </div>
        <Title level={4} className="text-slate-700 m-0">Hệ thống đang hoạt động ổn định</Title>
        <Text type="secondary" className="mt-2 text-slate-500 max-w-md">
          Mọi thiết lập và cấu hình mới nhất của bạn đã được áp dụng. Bạn có thể điều hướng từ menu bên trái để bắt đầu quản trị các module.
        </Text>
      </div>
    </div>
  );
};

export default AdminDashboard;
