import { useId } from "react";

// Tex, the Tradexcel assistant: a chat bubble with a rising trend line, in
// the app's blue. Used on the launcher, the panel header and beside replies.
const SIZES = { sm: 28, md: 36, lg: 56 } as const;

export default function TexAvatar({ size = "md", className = "" }: { size?: keyof typeof SIZES; className?: string }) {
  const gradient = `tex-${useId().replace(/:/g, "")}`;
  const px = SIZES[size];
  return (
    <svg aria-hidden="true" width={px} height={px} viewBox="0 0 40 40" className={`shrink-0 ${className}`}>
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
      <path d="M9 5h22a6 6 0 0 1 6 6v14a6 6 0 0 1-6 6H16l-7 5v-5a6 6 0 0 1-6-6V11a6 6 0 0 1 6-6z" fill={`url(#${gradient})`} />
      <path d="M10 23l6-6 5 4 9-9" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="30" cy="12" r="2.4" fill="#fff" />
    </svg>
  );
}
