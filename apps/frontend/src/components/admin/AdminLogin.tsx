"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { adminLogin } from "../../api/adminApi";
import { apiErrorMessage } from "../../api/http";
import { markAdminSession } from "../../utils/sessionFlag";

function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      setIsLoading(true);
      // The admin token itself is set by the backend as an httpOnly cookie.
      const response = await adminLogin(password);
      markAdminSession(response.data.expiresAt);
      router.push("/admin/contests");
    } catch (err) {
      setError(apiErrorMessage(err, "We couldn't sign you in. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-900 text-white font-pop px-4">
      <div className="max-w-sm w-full border border-gray-700 rounded-2xl p-8 bg-gray-800 shadow-lg">
        <h1 className="text-xl font-bold mb-1">Admin Access</h1>
        <p className="text-sm text-gray-400 mb-6">Internal tool - authorized personnel only.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div>
            <label htmlFor="admin-login-password" className="text-gray-300 text-sm mb-2 block">Password</label>
            <input
              id="admin-login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-gray-900 border border-gray-600 w-full text-sm px-4 py-3 rounded-md outline-blue-500 text-white"
              placeholder="Enter admin password"
              autoFocus
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 text-sm font-semibold rounded-md text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? "Verifying..." : "Log In"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default AdminLogin;
