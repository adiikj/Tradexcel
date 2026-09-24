"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerUser } from "../../api/api";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import GoogleAuthButton from "./GoogleAuthButton";
import AuthLayout, { AUTH_INPUT, AUTH_LABEL, AUTH_SUBMIT, Divider, FormError, Spinner } from "./AuthLayout";
import { apiErrorMessage } from "../../api/http";

function SignUp() {
  const navigate = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    pin: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const { name, username, email, password, pin } = formData;

    if (!name || !username || !email || !password || !pin) {
      return setError("Name, username, email, password, and PIN are required.");
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

    const payload = {
      name,
      username,
      email,
      password,
      pin,
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
      setError(apiErrorMessage(err, "We couldn't create your account. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const togglePinVisibility = () => setShowPin(!showPin);

  const hint = "mt-1.5 text-xs text-gray-500";

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Free forever. No card, no deposits."
      panelTitle="Start with ₹1,00,000 and trade the real market."
      points={["₹1,00,000 in virtual cash, reset every week", "250+ NSE stocks at live prices", "Contests, leaderboards and 18 badges to earn"]}
    >
      <GoogleAuthButton onError={setError} />
      <div className="my-6">
        <Divider>or sign up with email</Divider>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <FormError>{error}</FormError>}
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="sign-up-name" className={AUTH_LABEL}>
              Name
            </label>
            <input id="sign-up-name" name="name" type="text" autoComplete="name" className={AUTH_INPUT} placeholder="Aditya Sharma" value={formData.name} onChange={handleChange} />
          </div>
          <div>
            <label htmlFor="sign-up-username" className={AUTH_LABEL}>
              Username
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">@</span>
              <input
                id="sign-up-username"
                name="username"
                type="text"
                autoComplete="username"
                aria-describedby="sign-up-username-hint"
                className={`${AUTH_INPUT} pl-8`}
                placeholder="aditya_trades"
                value={formData.username}
                onChange={handleChange}
              />
            </div>
            <p id="sign-up-username-hint" className={hint}>
              Letters, numbers and underscores.
            </p>
          </div>
        </div>
        <div>
          <label htmlFor="sign-up-email" className={AUTH_LABEL}>
            Email
          </label>
          <input id="sign-up-email" name="email" type="email" autoComplete="email" className={AUTH_INPUT} placeholder="you@example.com" value={formData.email} onChange={handleChange} />
        </div>
        <div className="grid gap-5 sm:grid-cols-[1.4fr_1fr]">
          <div>
            <label htmlFor="sign-up-password" className={AUTH_LABEL}>
              Password
            </label>
            <div className="relative">
              <input
                id="sign-up-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                aria-describedby="sign-up-password-hint"
                className={`${AUTH_INPUT} pr-12`}
                placeholder="Your password"
                value={formData.password}
                onChange={handleChange}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-gray-400 hover:text-gray-700"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <AiOutlineEyeInvisible aria-hidden="true" /> : <AiOutlineEye aria-hidden="true" />}
              </button>
            </div>
            <p id="sign-up-password-hint" className={hint}>
              At least 8 characters.
            </p>
          </div>
          <div>
            <label htmlFor="sign-up-pin" className={AUTH_LABEL}>
              4-digit PIN
            </label>
            <div className="relative">
              <input
                id="sign-up-pin"
                name="pin"
                type={showPin ? "text" : "password"}
                inputMode="numeric"
                autoComplete="off"
                maxLength={4}
                aria-describedby="sign-up-pin-hint"
                className={`${AUTH_INPUT} pr-12 font-mono tracking-[0.4em]`}
                placeholder="••••"
                value={formData.pin}
                onChange={handleChange}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-gray-400 hover:text-gray-700"
                onClick={togglePinVisibility}
                aria-label={showPin ? "Hide PIN" : "Show PIN"}
              >
                {showPin ? <AiOutlineEyeInvisible aria-hidden="true" /> : <AiOutlineEye aria-hidden="true" />}
              </button>
            </div>
            <p id="sign-up-pin-hint" className={hint}>
              For quick sign-in later.
            </p>
          </div>
        </div>

        <button type="submit" disabled={isLoading} className={AUTH_SUBMIT}>
          {isLoading ? <Spinner /> : "Create account"}
        </button>
        <p className="text-center text-xs text-gray-500">
          By signing up you agree to our{" "}
          <Link href="/terms" className="underline hover:text-gray-800">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-gray-800">
            Privacy Policy
          </Link>
          .
        </p>
      </form>

      <p className="mt-8 text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link href="/signin" className="font-semibold text-blue-600 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}

export default SignUp;
