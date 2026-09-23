"use client";
import React from "react";
import Header from "./Header";
import Vheader from "./Vheader";
import MainContent from "./MainContent";

function Dashboard() {

  return (
    <>
      <div className="bg-white text-black min-h-screen transition-all duration-300 dark:bg-gray-800 dark:text-white">
        <Header />
        <div className="flex">
          <Vheader />
          <MainContent />
        </div>
      </div>
    </>
  );
}

export default Dashboard;
