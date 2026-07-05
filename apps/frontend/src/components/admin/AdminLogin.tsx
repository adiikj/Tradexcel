"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminLogin } from "../../api/adminApi";

function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("adminToken")) {
      router.push("/admin/contests");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      setIsLoading(true);
      const response = await adminLogin(password);
      const token = response?.data?.token;
      if (!token) throw new Error("Login response missing token");
      localStorage.setItem("adminToken", token);
      router.push("/admin/contests");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white font-pop px-4">
      <div className="max-w-sm w-full border border-gray-700 rounded-2xl p-8 bg-gray-800 shadow-lg">
        <h1 className="text-xl font-bold mb-1">Admin Access</h1>
        <p className="text-sm text-gray-400 mb-6">Internal tool — authorized personnel only.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div>
            <label className="text-gray-300 text-sm mb-2 block">Password</label>
            <input
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
    </div>
  );
}

export default AdminLogin;
