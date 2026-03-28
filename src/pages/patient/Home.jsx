// src/pages/patient/Home.jsx
import React from "react";
import ListDoctor from "./components/ListDoctor";
import HomeHero from "./components/HomeHero";
import HomeProducts from "./components/HomeProducts";

const Home = () => {
  return (
    <div className="w-full">
      {/* 1. Section Banner có cô gái */}
      <HomeHero />

      {/* 2. Section Sản phẩm / Routine */}
      <HomeProducts />

      {/* 3. Section Bác sĩ */}
      <ListDoctor />
    </div>
  );
};

export default Home;
