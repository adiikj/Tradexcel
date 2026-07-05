"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { motion } from "framer-motion";
import logo from "../../assets/logo-icon-transparent.png";
import wordmark from "../../assets/tradexcel-wordmark-light.png";
import { verifyOTP } from "../../api/api";
import { persistSession } from "../../utils/authSession";

function EnterOTP() {
  const [isLoading, setIsLoading] = useState<any>(false);
  const navigate = useRouter();
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const allowOTP = searchParams.get("allowOTP") === "true";
  const email = searchParams.get("email") || "";

  useEffect(() => {
    if (!allowOTP || !email) {
      navigate.push("/");
    }
  }, [allowOTP, email, navigate]);

  const [otp, setOtp] = useState<any>(["", "", "", "", "", ""]);
  const [error, setError] = useState<any>("");

  useEffect(() => {
    const firstInput = document.getElementById(`otp-input-0`);
    if (firstInput) firstInput.focus();
  }, []);

  const handleChange = (e, index) => {
    const value = e.target.value;
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < otp.length - 1) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    } else if (!value && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (otp.some((digit) => digit === "")) {
      return setError("Please enter the full OTP.");
    }

    const enteredOtp = otp.join("");

    try {
      setIsLoading(true);
      const response = await verifyOTP(email, enteredOtp);
      const accessToken = response?.data?.accessToken;
      if (!accessToken) throw new Error("Verification succeeded but no session was returned.");

      persistSession(dispatch, accessToken);
      navigate.push("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Invalid OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className="flex flex-col justify-center items-center min-h-screen pt-10 font-pop p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <motion.div
        className="flex flex-row gap-3 justify-center items-center text-center pb-6"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <img className="w-8 sm:w-10 h-8 sm:h-10" src={((logo)?.src || (logo)) as string} alt="" />
        <img className="h-6 sm:h-7 w-auto" src={((wordmark)?.src || (wordmark)) as string} alt="Tradexcel" />
      </motion.div>

      <motion.div
        className="max-w-md w-full mx-auto bg-white border border-gray-300 rounded-2xl p-6 sm:p-8 shadow-md"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-gray-600 text-sm text-center mb-4">
          We emailed a 6-digit code to <span className="font-semibold">{email}</span>
        </p>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 sm:space-y-6">
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
            <div>
              <label className="text-gray-800 text-sm sm:text-base mb-2 block">
                Enter OTP
              </label>
              <div className="flex gap-2 sm:gap-4 justify-center">
                {otp.map((digit, index) => (
                  <motion.input
                    key={index}
                    id={`otp-input-${index}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(e, index)}
                    className="w-10 h-10 sm:w-12 sm:h-12 text-center text-lg sm:text-xl border border-gray-300 rounded-md outline-blue-500 focus:ring-2 focus:ring-blue-500"
                    placeholder="-"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  />
                ))}
              </div>
            </div>
          </div>

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
              "Submit OTP"
            )}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default EnterOTP;
