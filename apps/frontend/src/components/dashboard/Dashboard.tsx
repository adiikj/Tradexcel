"use client";
import React from "react";
import { useContext } from "react";
import Header from "./Header";
import Vheader from "./Vheader";
import MainContent from "./MainContent";
import ThemeContext from "../../context/ThemeContext";
import { Helmet } from 'react-helmet';

function Dashboard() {
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);

  return (
    <>
      <Helmet>
        <title>Dashboard</title>
      </Helmet>
      <div className={darkMode ? "bg-gray-800 text-white min-h-screen transition-all duration-300" : "bg-white text-black min-h-screen transition-all duration-300"}>
        <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        <div className="flex">
          <Vheader darkMode={darkMode} />
          <MainContent darkMode={darkMode} />
        </div>
      </div>
    </>
  );
}

export default Dashboard;
