"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerUser } from "../../api/api";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { motion } from "framer-motion";
import GoogleAuthButton from "./GoogleAuthButton";

function SignUp() {
  const navigate = useRouter();

  const [showPassword, setShowPassword] = useState<any>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<any>(false);
  const [showPin, setShowPin] = useState<any>(false);
  const [isLoading, setIsLoading] = useState<any>(false);

  const [formData, setFormData] = useState<any>({
    name: "",
    username: "",
    email: "",
    password: "",
    cpassword: "",
    day: "",
    month: "",
    year: "",
    pin: "",
  });

  const [error, setError] = useState<any>("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const { name, username, email, password, cpassword, day, month, year, pin } = formData;

    if (!name || !username || !email || !password || !cpassword || !pin) {
      return setError("Name, username, email, password, and PIN are required.");
    }

    if (password !== cpassword) {
      return setError("Password and Confirm Password do not match.");
    }

    if (password.length < 8) {
      return setError("Password must be at least 8 characters.");
    }

    if (!/^\d{4}$/.test(pin)) {
      return setError("PIN must be a 4-digit number.");
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError("Username should only contain letters, numbers, and underscores. No spaces or special characters allowed.");
      return;
    }

    const dob = day && month && year ? new Date(`${year}-${month}-${day}`).toISOString().split("T")[0] : undefined;

    const payload = {
      name,
      username,
      email,
      password,
      pin,
      dob,
    };

    try {
      setIsLoading(true);
      const response = await registerUser(payload);

      if (response?.message) {
        const queryParams = new URLSearchParams({
          email: payload.email || "",
          allowOTP: "true",
        }).toString();
        navigate.push("/signup/otp?" + queryParams);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Error registering. Please try again.";
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const togglePinVisibility = () => setShowPin(!showPin);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  return (
    <>
      <motion.div
        className="flex flex-col justify-center font-pop h-full p-4 pb-10 bg-grey"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col items-center font-pop justify-center pt-8">
          <motion.span
            className="text-4xl text-blue-900 font-bold font-pop pb-2"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            SIGN UP
          </motion.span>
          <motion.p
            className="text-lg font-pop pb-7"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          >
            Create Your Account
          </motion.p>
        </div>

        <motion.div
          className="max-w-md w-full mx-auto border-2 border-btn-blue rounded-2xl p-8 bg-white"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="mb-6">
            <GoogleAuthButton onError={setError} />
          </div>
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px flex-1 bg-gray-300" />
            <span className="text-gray-500 text-sm">or sign up with email</span>
            <div className="h-px flex-1 bg-gray-300" />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {error && (
                <motion.p
                  className="text-red-500 text-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  {error}
                </motion.p>
              )}
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <label className="text-gray-800 text-sm mb-2 block">Your Name</label>
                <input
                  name="name"
                  type="text"
                  className="text-gray-800 bg-white border border-gray-300 w-full text-sm px-4 py-3 rounded-md outline-blue-500"
                  placeholder="Enter Your Name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </motion.div>
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <label className="text-gray-800 text-sm mb-2 block">Your Username</label>
                <input
                  name="username"
                  type="text"
                  className="text-gray-800 bg-white border border-gray-300 w-full text-sm px-4 py-3 rounded-md outline-blue-500"
                  placeholder="Enter Your Username"
                  value={formData.username}
                  onChange={handleChange}
                />
              </motion.div>
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <label className="text-gray-800 text-sm mb-2 block">Email ID</label>
                <input
                  name="email"
                  type="text"
                  className="text-gray-800 bg-white border border-gray-300 w-full text-sm px-4 py-3 rounded-md outline-blue-500"
                  placeholder="Enter email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </motion.div>
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="relative"
              >
                <label className="text-gray-800 text-sm mb-2 block">Password</label>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  className="text-gray-800 bg-white border border-gray-300 w-full text-sm px-4 py-3 rounded-md outline-blue-500"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <span
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer pt-6"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                </span>
              </motion.div>
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="relative"
              >
                <label className="text-gray-800 text-sm mb-2 block">Confirm Password</label>
                <input
                  name="cpassword"
                  type={showConfirmPassword ? "text" : "password"}
                  className="text-gray-800 bg-white border border-gray-300 w-full text-sm px-4 py-3 rounded-md outline-blue-500"
                  placeholder="Enter confirm password"
                  value={formData.cpassword}
                  onChange={handleChange}
                />
                <span
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer pt-6"
                  onClick={toggleConfirmPasswordVisibility}
                >
                  {showConfirmPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                </span>
              </motion.div>
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="relative"
              >
                <label className="text-gray-800 text-sm mb-2 block">4-Digit PIN</label>
                <p className="text-gray-500 text-xs mb-2">
                  A quick way to log in later, instead of your password.
                </p>
                <input
                  name="pin"
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  maxLength={4}
                  className="text-gray-800 bg-white border border-gray-300 w-full text-sm px-4 py-3 rounded-md outline-blue-500"
                  placeholder="Enter a 4-digit PIN"
                  value={formData.pin}
                  onChange={handleChange}
                />
                <span
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer pt-6"
                  onClick={togglePinVisibility}
                >
                  {showPin ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                </span>
              </motion.div>

              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.9 }}
              >
                <label className="text-gray-800 text-sm mb-2 block">Date of Birth (optional)</label>
                <div className="flex gap-4">
                  <select
                    name="day"
                    className="text-gray-800 bg-white border border-gray-300 w-24 text-sm px-2 md:px-4 py-3 rounded-md"
                    value={formData.day}
                    onChange={handleChange}
                  >
                    <option value="">Day</option>
                    {[...Array(31)].map((_, i) => (
                      <option key={i} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                  <select
                    name="month"
                    className="text-gray-800 bg-white border border-gray-300 w-36 text-sm px-1 md:px-4 py-3 rounded-md"
                    value={formData.month}
                    onChange={handleChange}
                  >
                    <option value="">Month</option>
                    {[
                      "January",
                      "February",
                      "March",
                      "April",
                      "May",
                      "June",
                      "July",
                      "August",
                      "September",
                      "October",
                      "November",
                      "December",
                    ].map((month, i) => (
                      <option key={i} value={i + 1}>
                        {month}
                      </option>
                    ))}
                  </select>
                  <select
                    name="year"
                    className="text-gray-800 bg-white border border-gray-300 w-28 text-sm px-2 md:px-4 py-3 rounded-md"
                    value={formData.year}
                    onChange={handleChange}
                  >
                    <option value="">Year</option>
                    {Array.from({ length: 100 }, (_, i) => 2024 - i).map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </motion.div>

              <motion.button
                type="submit"
                className="mt-6 w-full py-3 px-4 text-sm tracking-wider flex justify-center items-center font-semibold rounded-md text-white bg-btn-blue hover:bg-blue-600 focus:outline-none"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                {isLoading ? (
                  <div className="loader border-t-2 border-white w-5 h-5 rounded-full animate-spin"></div>
                ) : (
                  "Sign Up"
                )}
              </motion.button>
            </div>
          </form>
          <motion.div
            className="text-center mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <span className="text-sm text-gray-700">Already have an account?</span>
            <Link href="/signin" className="text-blue-500 text-sm font-bold ml-2">
              Login here
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    </>
  );
}

export default SignUp;
