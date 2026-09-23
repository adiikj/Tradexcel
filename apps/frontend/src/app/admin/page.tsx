import { redirect } from "next/navigation";

// src/proxy.ts sends logged-out visitors to /admin/login before this runs.
export default function Page() {
  redirect("/admin/contests");
}
