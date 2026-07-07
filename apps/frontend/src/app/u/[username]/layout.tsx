import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;

  return {
    title: `@${username} on Tradexcel`,
    description: `Check out @${username}'s trading profile, portfolio performance, and rank on Tradexcel.`,
  };
}

export default function UsernameLayout({ children }: { children: React.ReactNode }) {
  return children;
}
