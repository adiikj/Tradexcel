"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Checks localStorage directly rather than a cookie — this token never
// needs to be sent to the server automatically (no SSR pages depend on it),
// so there's no reason to expose it as a cookie.
const AdminRoute = ({ children }) => {
  const navigate = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;
    if (!token) {
      navigate.push("/admin/login");
    } else {
      setChecked(true);
    }
  }, [navigate]);

  if (!checked) return null;

  return children;
};

export default AdminRoute;
