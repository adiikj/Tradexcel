"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  useEffect(() => {
    const hasToken = typeof window !== "undefined" && localStorage.getItem("adminToken");
    router.replace(hasToken ? "/admin/contests" : "/admin/login");
  }, [router]);

  return null;
}
