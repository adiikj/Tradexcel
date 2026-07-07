"use client";
import { use } from "react";
import PublicProfile from "@/components/social/PublicProfile";
import NoHeaderFooterLayout from "@/components/layout/NoHeaderFooterLayout";

export default function Page({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);

  return (
    <NoHeaderFooterLayout>
      <PublicProfile username={username} />
    </NoHeaderFooterLayout>
  );
}
