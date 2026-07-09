"use client";
import React, { useState, useEffect, useContext } from "react";
import Link from "next/link";
import { FaEdit, FaSave, FaEye, FaEyeSlash, FaTimes, FaUserCircle } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import Header from "./Header";
import Vheader from "./Vheader";
import ThemeContext from "../../context/ThemeContext";
import { Helmet } from "react-helmet";
import { getUserProfile, updateUserProfile, changePasswordAndPin, updateAvatar } from "../../api/api";

function YourProfile() {
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);

  const [activeSection, setActiveSection] = useState<any>("personal");
  const [formData, setFormData] = useState<any>({
    name: "",
    username: "",
    email: "",
    phoneNumber: "",
    dob: "",
    avatar: null,
  });

  const [securityData, setSecurityData] = useState<any>({
    oldPassword: "",
    newPassword: "",
    oldPin: "",
    newPin: "",
  });

  const [initialData, setInitialData] = useState<any>({});
  const [isEditing, setIsEditing] = useState<any>(false);
  const [accountFlags, setAccountFlags] = useState<any>({
    hasGoogleLogin: false,
    hasPassword: false,
    hasPin: false,
  });
  const [showPassword, setShowPassword] = useState<any>({
    oldPassword: false,
    newPassword: false,
    oldPin: false,
    newPin: false,
  });
  const [streak, setStreak] = useState<any>({ currentStreak: 0, longestStreak: 0 });

  const fetchUserProfile = async () => {
    try {
      const response = await getUserProfile();
      if (response.status === 200 && response.data) {
        const {
          name,
          username,
          email,
          phoneNumber,
          dob,
          avatar,
          hasGoogleLogin,
          hasPassword,
          hasPin,
          currentStreak,
          longestStreak,
        } = response.data;
        const formattedDob = dob ? new Date(dob).toISOString().split("T")[0] : "";

        const initial = {
          name: name || "",
          username: username || "",
          email: email || "",
          phoneNumber: phoneNumber || "",
          dob: formattedDob,
          avatar: avatar || null,
        };

        setFormData(initial);
        setInitialData(initial);
        setAccountFlags({ hasGoogleLogin: !!hasGoogleLogin, hasPassword: !!hasPassword, hasPin: !!hasPin });
        setStreak({ currentStreak: currentStreak || 0, longestStreak: longestStreak || 0 });
      }
    } catch (err) {
      // Fields stay at their defaults; the form is still usable.
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (activeSection === "personal") {
      setFormData((prev) => ({ ...prev, [name]: value }));
    } else if (activeSection === "security") {
      setSecurityData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleEditToggle = () => {
    setIsEditing((prev) => !prev);
    if (isEditing) {
      // Reset to initial data on cancel
      setFormData(initialData);
      setSecurityData({
        oldPassword: "",
        newPassword: "",
        oldPin: "",
        newPin: "",
      });
    }
  };

  const handleSectionChange = (section) => {
    if (isEditing) {
      alert("Please save or cancel your current changes before switching sections.");
      return;
    }
    setActiveSection(section);
  };

  const handleAvatarUpdate = async () => {
    try {
      if (!(formData.avatar instanceof File)) {
        alert("Please select a valid file to upload.");
        return;
      }

      const avatarPayload = new FormData();
      avatarPayload.append("avatar", formData.avatar);

      const avatarResponse = await updateAvatar(avatarPayload);
      if (avatarResponse) {
        alert("Avatar updated successfully! Please reload the page to see the changes.");
        setFormData((prev) => ({ ...prev, avatar: avatarResponse.data.avatar }));
      } else {
        alert("Failed to update avatar.");
      }
    } catch (err) {
      alert("There was an error updating the avatar. Please try again.");
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (formData.avatar instanceof File) {
      await handleAvatarUpdate();
      return;
    }
    
    const payload: any = {};

    if (activeSection === "personal") {
      if (formData.name || formData.username || formData.email || formData.phoneNumber || formData.dob || formData.profilePicture) {
        payload.name = formData.name;
        payload.username = formData.username;
        payload.email = formData.email;
        payload.phoneNumber = formData.phoneNumber;
        payload.dob = formData.dob;
      }
    } else if (activeSection === "security") {
      // oldPassword/oldPin are only sent when the account already has one.
      if (securityData.newPassword) {
        payload.newPassword = securityData.newPassword;
        if (accountFlags.hasPassword) payload.oldPassword = securityData.oldPassword;
      }
      if (securityData.newPin) {
        payload.newPin = securityData.newPin;
        if (accountFlags.hasPin) payload.oldPin = securityData.oldPin;
      }
    }

    try {
      let response;
      if (activeSection === "personal") {
        response = await updateUserProfile(payload);
      } else if (activeSection === "security") {
        if (Object.keys(payload).length === 0) {
          alert("Enter a new password and/or PIN to save.");
          return;
        }
        response = await changePasswordAndPin(payload);
      }

      if (response.status === 200) {
        alert("Profile updated successfully!");
        if (activeSection === "personal") {
          setInitialData({ ...formData });
        } else {
          setSecurityData({ oldPassword: "", newPassword: "", oldPin: "", newPin: "" });
          await fetchUserProfile();
        }
      } else {
        alert("Failed to update profile. Please try again.");
      }
    } catch (err) {
      alert("There was an error updating the profile. Please try again.");
    }

    setIsEditing(false);
  };

  const handleAvatarChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData((prev) => ({
        ...prev,
        avatar: file,
      }));
    }
  };

  const handleShowPassword = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const renderField = (label, name, type = "text") => (
    <div>
      <label
        htmlFor={name}
        className={`block font-pop font-medium mb-2 ${darkMode ? "text-gray-200" : "text-gray-800"}`}
      >
        {label}
      </label>
      {isEditing ? (
        <div className="relative">
          <input
            type={showPassword[name] ? "text" : type}
            id={name}
            name={name}
            value={activeSection === "personal" ? formData[name] : securityData[name]}
            onChange={handleChange}
            className={`w-full p-3 border rounded-md transition-all duration-300 focus:ring-2 focus:ring-blue-500 ${
              darkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-300 text-gray-800"
            }`}
          />
          {type === "password" && (
            <button
              type="button"
              onClick={() => handleShowPassword(name)}
              className="absolute top-1/2 right-3 transform -translate-y-1/2"
            >
              {showPassword[name] ? <FaEyeSlash /> : <FaEye />}
            </button>
          )}
        </div>
      ) : (
        <p
          className={`p-3 border rounded-md transition-all duration-300 ${
            darkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-gray-100 border-gray-300 text-gray-800"
          }`}
        >
          {type === "password"
            ? "********"
            : (activeSection === "personal" ? formData[name] : securityData[name]) || "N/A"}
        </p>
      )}
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Your Profile</title>
      </Helmet>
      <div className={`min-h-screen font-pop transition-all duration-300 ${darkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"}`}>
        <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        <div className="flex flex-col lg:flex-row mb-16 md:mb-0">
          <Vheader darkMode={darkMode} />
          <main className="flex-1 min-w-0 p-6 md:m-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className={`text-2xl md:text-3xl font-bold transition-all duration-300 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                Your Profile
              </h1>
              {formData.username && (
                <div className="flex items-center gap-3">
                  {streak.currentStreak > 0 && (
                    <span
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                        darkMode ? "bg-amber-900/40 text-amber-300" : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      🔥 {streak.currentStreak}-day streak
                    </span>
                  )}
                  <Link
                    href={`/u/${formData.username}`}
                    className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-200"
                  >
                    <FaUserCircle /> View Public Profile
                  </Link>
                </div>
              )}
            </div>
            <div className="h-2 w-32 md:w-44 bg-blue-500 rounded-full mb-7 animate-line"></div>
            <div className={`max-w-4xl mx-auto transition-all duration-300 shadow-lg rounded-lg overflow-hidden ${darkMode ? "bg-gray-900 text-gray-200" : "bg-gray-100 text-gray-800"}`}>
              <div className={`p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-center border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                <div className="flex space-x-4">
                  <button
                    className={`px-4 py-2 text-sm md:text-base font-semibold rounded-full ${
                      activeSection === "personal" ? "bg-blue-500 text-white shadow" : darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-300 text-black"
                    }`}
                    onClick={() => handleSectionChange("personal")}
                  >
                    Personal Info
                  </button>
                  <button
                    className={`px-4 py-2 text-sm md:text-base font-semibold rounded-full ${
                      activeSection === "security" ? "bg-blue-500 text-white shadow" : darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-300 text-black"
                    }`}
                    onClick={() => handleSectionChange("security")}
                  >
                    Security Info
                  </button>
                </div>
                <div className="flex items-center mt-3 md:mt-0 space-x-3">
                  {isEditing && (
                    <button
                      onClick={handleEditToggle}
                      className="flex items-center text-sm md:text-base px-4 py-2 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-md"
                    >
                      <FaTimes className="mr-2" /> Cancel
                    </button>
                  )}
                  <button
                    onClick={isEditing ? handleSubmit : handleEditToggle}
                    className={`flex items-center text-sm md:text-base px-4 py-2 rounded-full transition shadow-md ${
                      isEditing ? "bg-green-500 hover:bg-green-600 text-white" : "bg-blue-500 hover:bg-blue-600 text-white"
                    }`}
                  >
                    {isEditing ? <FaSave className="mr-2" /> : <FaEdit className="mr-2" />} {isEditing ? "Save" : "Edit"}
                  </button>
                </div>
              </div>
              <form id="profile-form" onSubmit={handleSubmit} className="p-4 sm:p-6 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                {activeSection === "personal" && (
                  <>
                    <div className="col-span-1 md:col-span-2 flex flex-col items-center">
                      <div className="relative">
                        <img
                          src={(
                            formData.avatar instanceof File
                              ? URL.createObjectURL(formData.avatar)
                              : formData.avatar || "https://via.placeholder.com/120x120.png?text=No+Avatar"
                          )?.src || (
                            formData.avatar instanceof File
                              ? URL.createObjectURL(formData.avatar)
                              : formData.avatar || "https://via.placeholder.com/120x120.png?text=No+Avatar"
                          )}
                          alt="Profile Preview"
                          className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full transition-all duration-300 border-4 object-cover ${darkMode ? "border-gray-600" : "border-gray-200"}`}
                        />
                        {isEditing && (
                          <>
                            <label htmlFor="avatar" className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600 transition">
                              <FaEdit />
                            </label>
                            <input
                              type="file"
                              id="avatar"
                              accept="image/*"
                              onChange={handleAvatarChange}
                              className="hidden"
                            />
                          </>
                        )}
                      </div>
                    </div>
                    {renderField("Name", "name")}
                    {renderField("Username", "username")}
                    {renderField("Email", "email", "email")}
                    {renderField("Phone Number", "phoneNumber")}
                    {renderField("Date of Birth", "dob", "date")}
                  </>
                )}
                {activeSection === "security" && (
                  <>
                    <div className="col-span-1 md:col-span-2">
                      <h3 className={`font-semibold mb-2 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                        Connected Accounts
                      </h3>
                      <div
                        className={`flex items-center justify-between p-3 rounded-md border ${
                          darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <FcGoogle size={18} /> Google
                        </span>
                        {accountFlags.hasGoogleLogin ? (
                          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-500/15 text-green-500">
                            Connected
                          </span>
                        ) : (
                          <span
                            className={`text-xs font-semibold px-2 py-1 rounded-full ${
                              darkMode ? "bg-gray-600 text-gray-300" : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            Not connected
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="col-span-1 md:col-span-2 mt-2">
                      <h3 className={`font-semibold mb-1 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                        {accountFlags.hasPassword ? "Change Password" : "Set a Password"}
                      </h3>
                      {!accountFlags.hasPassword && (
                        <p className="text-xs text-gray-400 mb-2">
                          Your account currently signs in with Google only. Set a password to also enable normal login.
                        </p>
                      )}
                    </div>
                    {accountFlags.hasPassword && renderField("Current Password", "oldPassword", "password")}
                    {renderField(accountFlags.hasPassword ? "New Password" : "Password", "newPassword", "password")}

                    <div className="col-span-1 md:col-span-2 mt-2">
                      <h3 className={`font-semibold mb-1 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                        {accountFlags.hasPin ? "Change PIN" : "Set a PIN"}
                      </h3>
                      {!accountFlags.hasPin && (
                        <p className="text-xs text-gray-400 mb-2">
                          Set a 4-digit PIN for quick sign-in without your password.
                        </p>
                      )}
                    </div>
                    {accountFlags.hasPin && renderField("Current PIN", "oldPin", "password")}
                    {renderField(accountFlags.hasPin ? "New PIN" : "PIN", "newPin", "password")}
                  </>
                )}
              </form>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

export default YourProfile;
