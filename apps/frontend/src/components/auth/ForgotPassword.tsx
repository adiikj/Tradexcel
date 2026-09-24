"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { forgotPassword, resetPassword } from "../../api/api";
import { apiErrorMessage } from "../../api/http";
import AuthLayout, { AUTH_INPUT, AUTH_LABEL, AUTH_SUBMIT, FormError, Spinner } from "./AuthLayout";

// Matches the server's per-account resend cooldown (user.controller.ts).
const RESEND_COOLDOWN_S = 60;

function ForgotPassword() {
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [mode, setMode] = useState<"password" | "pin">("password");
  const [value, setValue] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const sendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    try {
      setIsLoading(true);
      await forgotPassword(email);
      setStep("reset");
      setCooldown(RESEND_COOLDOWN_S);
    } catch (err) {
      setError(apiErrorMessage(err, "We couldn't send a reset code. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === "password" ? "pin" : "password");
    setValue("");
    setConfirm("");
    setError(null);
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (value !== confirm) {
      return setError(mode === "password" ? "The passwords don't match." : "The PINs don't match.");
    }
    try {
      setIsLoading(true);
      await resetPassword({ email, code, ...(mode === "password" ? { newPassword: value } : { newPin: value }) });
      toast.success(`${mode === "password" ? "Password" : "PIN"} updated. Sign in to continue.`);
      router.push("/signin");
    } catch (err) {
      setError(apiErrorMessage(err, "We couldn't reset your details. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  const noun = mode === "password" ? "password" : "PIN";

  return (
    <AuthLayout
      title={step === "email" ? "Forgot your password?" : "Check your email"}
      subtitle={
        step === "email" ? (
          "Enter your account email and we'll send you a code to reset your password or PIN."
        ) : (
          <>
            If an account exists for <span className="font-semibold text-gray-900">{email}</span>, we&apos;ve sent it a 6-digit code. It&apos;s valid for 10 minutes.
          </>
        )
      }
      panelTitle="Back to the market in a minute."
      points={["Reset your password or your 4-digit PIN", "Your portfolio and rank stay exactly as they were", "Every other device is signed out for safety"]}
    >
      {step === "email" ? (
        <form onSubmit={sendCode} className="space-y-5">
          {error && <FormError>{error}</FormError>}
          <div>
            <label htmlFor="forgot-email" className={AUTH_LABEL}>
              Email
            </label>
            <input
              id="forgot-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={AUTH_INPUT}
              placeholder="you@example.com"
              required
            />
          </div>
          <button type="submit" disabled={isLoading} className={AUTH_SUBMIT}>
            {isLoading ? <Spinner /> : "Send reset code"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleReset} className="space-y-5">
          {error && <FormError>{error}</FormError>}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="reset-code" className="text-sm font-medium text-gray-800">
                Reset code
              </label>
              <button
                type="button"
                onClick={() => sendCode()}
                disabled={cooldown > 0 || isLoading}
                className="text-xs font-semibold text-blue-600 hover:underline disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
              </button>
            </div>
            <input
              id="reset-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className={`${AUTH_INPUT} font-mono tracking-[0.4em]`}
              placeholder="••••••"
              required
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="reset-value" className="text-sm font-medium text-gray-800">
                {mode === "password" ? "New password" : "New 4-digit PIN"}
              </label>
              <button type="button" onClick={switchMode} className="text-xs font-semibold text-blue-600 hover:underline">
                Reset {mode === "password" ? "PIN" : "password"} instead
              </button>
            </div>
            <input
              id="reset-value"
              type="password"
              inputMode={mode === "pin" ? "numeric" : "text"}
              autoComplete={mode === "password" ? "new-password" : "off"}
              minLength={mode === "password" ? 8 : 4}
              maxLength={mode === "pin" ? 4 : undefined}
              pattern={mode === "pin" ? "\\d{4}" : undefined}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className={`${AUTH_INPUT} ${mode === "pin" ? "font-mono tracking-[0.4em]" : ""}`}
              placeholder={mode === "password" ? "At least 8 characters" : "••••"}
              required
            />
          </div>

          <div>
            <label htmlFor="reset-confirm" className={AUTH_LABEL}>
              Confirm new {noun}
            </label>
            <input
              id="reset-confirm"
              type="password"
              inputMode={mode === "pin" ? "numeric" : "text"}
              autoComplete={mode === "password" ? "new-password" : "off"}
              maxLength={mode === "pin" ? 4 : undefined}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={`${AUTH_INPUT} ${mode === "pin" ? "font-mono tracking-[0.4em]" : ""}`}
              required
            />
          </div>

          <button type="submit" disabled={isLoading} className={AUTH_SUBMIT}>
            {isLoading ? <Spinner /> : `Set new ${noun}`}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setError(null);
            }}
            className="w-full text-center text-sm text-gray-600 hover:underline"
          >
            Use a different email
          </button>
        </form>
      )}

      <p className="mt-8 text-center text-sm text-gray-600">
        Remembered it?{" "}
        <Link href="/signin" className="font-semibold text-blue-600 hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}

export default ForgotPassword;
