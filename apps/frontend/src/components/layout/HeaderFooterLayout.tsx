import React from "react";
import Header from "../landingPage/Header";
import Footer from "../landingPage/Footer";

const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
};

export default MainLayout;
