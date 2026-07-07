"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Uses localStorage, not a cookie: no SSR page depends on this token.
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
