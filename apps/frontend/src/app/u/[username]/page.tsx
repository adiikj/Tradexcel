import type { Metadata } from "next";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/utils/sessionFlag";
import PublicProfile from "@/components/social/PublicProfile";
import NoHeaderFooterLayout from "@/components/layout/NoHeaderFooterLayout";

type Props = { params: Promise<{ username: string }> };

// Rendered on the server so shared profile links get a real title and
// description (the preview image comes from ./opengraph-image.tsx).
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  let name: string | null = null;
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_TRADE_URL}/users/${encodeURIComponent(username)}/profile`, {
      next: { revalidate: 300 },
    });
    if (res.ok) name = (await res.json())?.data?.name ?? null;
  } catch {
    // Fall back to the username-only title.
  }
  const title = name ? `${name} (@${username})` : `@${username}`;
  return {
    title,
    description: `${title}'s trading profile on Tradexcel - net worth, rank and achievements.`,
  };
}

export default async function Page({ params }: Props) {
  const { username } = await params;
  const viewerLoggedIn = (await cookies()).get(SESSION_COOKIE)?.value === "1";
  return (
    <NoHeaderFooterLayout>
      {/* Keyed so moving between profiles starts from fresh state (tabs, lists). */}
      <PublicProfile key={username} username={username} viewerLoggedIn={viewerLoggedIn} />
    </NoHeaderFooterLayout>
  );
}
