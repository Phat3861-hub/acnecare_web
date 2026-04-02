import React from "react";
import { Button } from "antd";
import { CameraOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import "./HomeHero.css";

const HomeHero = () => {
  const navigate = useNavigate();

  return (
    <div className="relative w-full h-[500px] md:h-[600px] overflow-hidden flex items-center hero-container">
      {/* Background Image (Ảnh cô gái) - Cần thay bằng URL thật của bạn */}
      <div
        className="absolute right-0 top-0 w-full md:w-2/3 h-full bg-cover bg-center bg-no-repeat z-0 hero-bg-image"
        style={{
          backgroundImage:
            "url('https://t4.ftcdn.net/jpg/04/27/45/51/360_F_427455122_aQgSpwmeamkvYvuNkb8dhnSg5LZcGCsh.jpg')",
          maskImage: "linear-gradient(to right, transparent, black 40%)",
          WebkitMaskImage: "linear-gradient(to right, transparent, black 40%)",
        }}
      ></div>

      <div className="relative z-10 px-4 md:px-12 lg:px-24 w-full md:w-1/2">
        <h1 className="text-4xl md:text-5xl font-black leading-tight mb-8 hero-title">
          Cùng acneCare
          <br />
          chăm sóc làn da
          <br />
          mỗi ngày
        </h1>

        <div className="p-6 rounded-2xl max-w-sm hero-card">
          <div className="mb-4">
            <CameraOutlined className="text-4xl text-[#1e255e]" />
          </div>
          <p className="text-gray-600 text-sm mb-6 leading-relaxed">
            Chụp hoặc tải lên ảnh làn da của bạn, công nghệ trí tuệ nhân tạo sẽ
            phân tích tình trạng mụn, nhận diện loại mụn trong vài giây.
          </p>
          <Button
            type="default"
            shape="round"
            size="large"
            className="w-full font-medium h-12 hero-btn"
            onClick={() => navigate("/test-model")}
          >
            Quét da ngay
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HomeHero;
