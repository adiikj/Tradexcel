"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "../../api/api";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import GoogleAuthButton from "./GoogleAuthButton";
import AuthLayout, { AUTH_INPUT, AUTH_LABEL, AUTH_SUBMIT, Divider, FormError, Spinner } from "./AuthLayout";
import { persistSession, postLoginPath } from "../../utils/authSession";
import { apiErrorMessage } from "../../api/http";
import type { RootState } from "../../redux/store";

function SignIn() {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [credential, setCredential] = useState("");
  const [mode, setMode] = useState<"password" | "pin">("pin");
  const [error, setError] = useState<string | null>(null);
  const [showCredential, setShowCredential] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useRouter();
  const dispatch = useDispatch();

  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      navigate.push(postLoginPath());
    }
  }, [isAuthenticated, navigate]);

  const switchMode = () => {
    setMode(mode === "password" ? "pin" : "password");
    setCredential("");
    setError(null);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setIsLoading(true);
      const response = await loginUser(emailOrUsername, credential, mode);
      if (!response?.data?.user) throw new Error("Login succeeded but no session was returned.");

      persistSession(dispatch);
    } catch (err) {
      setError(apiErrorMessage(err, "Something went wrong. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to pick up where you left off."
      panelTitle="Your portfolio kept moving while you were away."
      points={["Live NSE prices on every holding", "See where you rank this season", "Contests and leagues waiting for you"]}
    >
      <GoogleAuthButton onError={setError} />
      <div className="my-6">
        <Divider>or sign in with email</Divider>
      </div>

      <form onSubmit={handleSignIn} className="space-y-5">
        {error && <FormError>{error}</FormError>}
        <div>
          <label htmlFor="sign-in-emailOrUsername" className={AUTH_LABEL}>
            Email or username
          </label>
          <input
            id="sign-in-emailOrUsername"
            name="emailOrUsername"
            type="text"
            autoComplete="username"
            value={emailOrUsername}
            onChange={(e) => setEmailOrUsername(e.target.value)}
            className={AUTH_INPUT}
            placeholder="you@example.com"
            required
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="sign-in-credential" className="text-sm font-medium text-gray-800">
              {mode === "password" ? "Password" : "4-digit PIN"}
            </label>
            <button type="button" onClick={switchMode} className="text-xs font-semibold text-blue-600 hover:underline">
              Use {mode === "password" ? "PIN" : "password"} instead
            </button>
          </div>
          <div className="relative">
            <input
              id="sign-in-credential"
              aria-label={mode === "password" ? "Password" : "4-digit PIN"}
              name="credential"
              type={showCredential ? "text" : "password"}
              inputMode={mode === "pin" ? "numeric" : "text"}
              autoComplete={mode === "password" ? "current-password" : "off"}
              maxLength={mode === "pin" ? 4 : undefined}
              value={credential}
              onChange={(e) => setCredential(e.target.value)}
              className={`${AUTH_INPUT} pr-12 ${mode === "pin" ? "font-mono tracking-[0.4em]" : ""}`}
              placeholder={mode === "password" ? "Your password" : "••••"}
              required
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-gray-400 hover:text-gray-700"
              onClick={() => setShowCredential(!showCredential)}
              aria-label={showCredential ? "Hide" : "Show"}
            >
              {showCredential ? <AiOutlineEyeInvisible aria-hidden="true" /> : <AiOutlineEye aria-hidden="true" />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={isLoading} className={AUTH_SUBMIT}>
          {isLoading ? <Spinner /> : "Sign in"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-gray-600">
        New to Tradexcel?{" "}
        <Link href="/signup" className="font-semibold text-blue-600 hover:underline">
          Create a free account
        </Link>
      </p>
    </AuthLayout>
  );
}

export default SignIn;
