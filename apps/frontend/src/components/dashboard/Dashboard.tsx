"use client";
import React from "react";
import Header from "./Header";
import Vheader from "./Vheader";
import MainContent from "./MainContent";
import ProductTour from "../tour/ProductTour";

function Dashboard() {

  return (
    <>
      <div className="min-h-screen bg-gray-50 text-gray-900 transition-colors duration-300 dark:bg-gray-800 dark:text-white">
        <Header />
        <div className="flex">
          <Vheader />
          <MainContent />
        </div>
        <ProductTour />
      </div>
    </>
  );
}

export default Dashboard;
