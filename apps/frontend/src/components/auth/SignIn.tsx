"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "../../api/api";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { motion } from "framer-motion";
import GoogleAuthButton from "./GoogleAuthButton";
import { persistSession } from "../../utils/authSession";

function SignIn() {
  const [emailOrUsername, setEmailOrUsername] = useState<any>("");
  const [credential, setCredential] = useState<any>("");
  const [mode, setMode] = useState<"password" | "pin">("password");
  const [error, setError] = useState<any>(null);
  const [showCredential, setShowCredential] = useState<any>(false);
  const [isLoading, setIsLoading] = useState<any>(false);
  const navigate = useRouter();
  const dispatch = useDispatch();

  const isAuthenticated = useSelector((state: any) => state.auth.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      navigate.push("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const switchMode = () => {
    setMode(mode === "password" ? "pin" : "password");
    setCredential("");
    setError(null);
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      setIsLoading(true);
      const response = await loginUser(emailOrUsername, credential, mode);
      const accessToken = response?.data?.accessToken;
      if (!accessToken) throw new Error("Access Token not found");

      persistSession(dispatch, accessToken);
    } catch (err) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col justify-center font-pop h-full p-4 pb-10 bg-grey"
    >
      <div className="flex flex-col items-center font-pop justify-center pt-8">
        <motion.span
          className="text-4xl text-blue-900 font-bold font-pop pb-2"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          Welcome Back
        </motion.span>
        <motion.p
          className="text-lg font-pop pb-7"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
        >
          Enter Your Details to Login
        </motion.p>
      </div>
      <motion.div
        className="max-w-md w-full mx-auto border-2 border-btn-blue rounded-2xl p-8 bg-white"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-6">
          <GoogleAuthButton onError={setError} />
        </div>
        <div className="flex items-center gap-4 mb-6">
          <div className="h-px flex-1 bg-gray-300" />
          <span className="text-gray-500 text-sm">or sign in with email</span>
          <div className="h-px flex-1 bg-gray-300" />
        </div>

        <form onSubmit={handleSignIn}>
          <div className="space-y-6">
            {error && (
              <motion.p
                className="text-red-500 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {error}
              </motion.p>
            )}
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <label className="text-gray-800 text-sm mb-2 block">
                Email or Username
              </label>
              <input
                name="emailOrUsername"
                type="text"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                className="text-gray-800 bg-white border border-gray-300 w-full text-sm px-4 py-3 rounded-md outline-blue-500"
                placeholder="Enter email or username"
                required
              />
            </motion.div>

            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="flex justify-between items-center mb-2">
                <label className="text-gray-800 text-sm block">
                  {mode === "password" ? "Password" : "4-Digit PIN"}
                </label>
                <button
                  type="button"
                  onClick={switchMode}
                  className="text-blue-500 text-xs font-semibold"
                >
                  Use {mode === "password" ? "PIN" : "password"} instead
                </button>
              </div>
              <div className="relative">
                <input
                  name="credential"
                  type={showCredential ? "text" : "password"}
                  inputMode={mode === "pin" ? "numeric" : "text"}
                  maxLength={mode === "pin" ? 4 : undefined}
                  value={credential}
                  onChange={(e) => setCredential(e.target.value)}
                  className="text-gray-800 bg-white border border-gray-300 w-full text-sm px-4 py-3 rounded-md outline-blue-500"
                  placeholder={mode === "password" ? "Enter password" : "Enter your 4-digit PIN"}
                  required
                />
                <span
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
                  onClick={() => setShowCredential(!showCredential)}
                >
                  {showCredential ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                </span>
              </div>
            </motion.div>
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
              "Sign In"
            )}
          </motion.button>
        </form>
        <p className="text-gray-800 text-md mt-6 text-center">
          Don't have an account?
          <Link href="/signup" className="text-blue-500 hover:underline font-semibold group ml-1">
            Sign up here
          </Link>
        </p>
      </motion.div>
    </motion.div>
  );
}

export default SignIn;
