"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { GoogleLogin } from "@react-oauth/google";
import { googleLogin } from "../../api/api";
import { persistSession } from "../../utils/authSession";

function GoogleAuthButton({ onError }: { onError: (message: string) => void }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);

  const handleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) {
      onError("Google did not return a credential. Please try again.");
      return;
    }

    try {
      setIsLoading(true);
      const response = await googleLogin(credentialResponse.credential);
      const accessToken = response?.data?.accessToken;

      if (accessToken) {
        persistSession(dispatch, accessToken);
        router.push("/dashboard");
      } else {
        // New account - same one-time OTP-email step as password signup.
        const email = response?.data?.email || "";
        const params = new URLSearchParams({ email, allowOTP: "true" }).toString();
        router.push(`/signup/otp?${params}`);
      }
    } catch (err: any) {
      onError(err?.message || "Google sign-in failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={isLoading ? "opacity-50 pointer-events-none" : ""}>
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => onError("Google sign-in failed. Please try again.")}
        width="100%"
      />
    </div>
  );
}

export default GoogleAuthButton;
