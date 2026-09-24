"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { motion } from "framer-motion";
import logo from "../../assets/logo-icon-transparent.png";
import wordmark from "../../assets/tradexcel-wordmark-light.png";
import { verifyOTP } from "../../api/api";
import { persistSession } from "../../utils/authSession";
import Image from "next/image";
import { apiErrorMessage } from "../../api/http";
import { AUTH_SUBMIT, FormError, Spinner } from "./AuthLayout";

function EnterOTP() {
  const [isLoading, setIsLoading] = useState(false);
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

  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState("");

  useEffect(() => {
    const firstInput = document.getElementById(`otp-input-0`);
    if (firstInput) firstInput.focus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance to the next box after a digit is typed.
    if (value && index < otp.length - 1) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  // Backspace on an empty box never fires onChange, so handle it here: step back and clear.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      e.preventDefault();
      const newOtp = [...otp];
      newOtp[index - 1] = "";
      setOtp(newOtp);
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  // Pasting the whole code from the email fills every box at once.
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, otp.length);
    if (digits.length < 2) return;
    e.preventDefault();
    const newOtp = otp.map((_, i) => digits[i] ?? "");
    setOtp(newOtp);
    document.getElementById(`otp-input-${Math.min(digits.length, otp.length - 1)}`)?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (otp.some((digit) => digit === "")) {
      return setError("Please enter the full OTP.");
    }

    const enteredOtp = otp.join("");

    try {
      setIsLoading(true);
      const response = await verifyOTP(email, enteredOtp);
      if (!response?.data?.user) throw new Error("Verification succeeded but no session was returned.");

      persistSession(dispatch);
      navigate.push("/dashboard");
    } catch (err) {
      setError(apiErrorMessage(err, "That code didn't work. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-grey p-4 font-pop">
      <div className="mb-8 flex items-center gap-3">
        <Image className="h-9 w-9" src={logo} alt="" />
        <Image className="h-6 w-auto" src={wordmark} alt="Tradexcel" />
      </div>

      <motion.div
        className="w-full max-w-md rounded-[2rem] border border-gray-200 bg-white p-8 sm:p-10"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-semibold text-gray-900">Check your email</h1>
        <p className="mt-2 text-sm text-gray-600">
          We sent a 6-digit code to <span className="font-semibold text-gray-900">{email}</span>. Enter it below to finish creating your account.
        </p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && <FormError>{error}</FormError>}
          <fieldset>
            <legend className="sr-only">Verification code</legend>
            <div className="flex justify-between gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-input-${index}`}
                  type="text"
                  inputMode="numeric"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  aria-label={`Digit ${index + 1} of ${otp.length}`}
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onPaste={handlePaste}
                  className="h-14 w-12 rounded-xl border border-gray-200 bg-white text-center font-mono text-2xl font-semibold text-gray-900 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500 sm:w-14"
                />
              ))}
            </div>
          </fieldset>
          <button type="submit" disabled={isLoading} className={AUTH_SUBMIT}>
            {isLoading ? <Spinner /> : "Verify and continue"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export default EnterOTP;
