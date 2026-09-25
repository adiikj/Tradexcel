import { useId } from "react";

// Tex, drawn as a friendly person in a Tradexcel-blue shirt, so the assistant
// feels like someone to talk to rather than a feature. Plain shapes on purpose:
// it has to read at 24px beside a message.
const SIZES = { xs: 24, sm: 32, md: 36, lg: 56 } as const;

export default function TexAvatar({ size = "sm", className = "" }: { size?: keyof typeof SIZES; className?: string }) {
  const clip = `tex-${useId().replace(/:/g, "")}`;
  const px = SIZES[size];
  return (
    <svg aria-hidden="true" width={px} height={px} viewBox="0 0 64 64" className={`shrink-0 rounded-full ${className}`}>
      <defs>
        <clipPath id={clip}>
          <circle cx="32" cy="32" r="32" />
        </clipPath>
      </defs>
      <circle cx="32" cy="32" r="32" fill="#DBEAFE" />
      <g clipPath={`url(#${clip})`}>
        {/* shirt + collar */}
        <path d="M9 66c1.5-13 11-20 23-20s21.5 7 23 20z" fill="#2563EB" />
        <path d="M26 46l6 7 6-7" fill="#fff" />
        {/* neck, face */}
        <rect x="27.5" y="38" width="9" height="9" rx="3" fill="#E9A87C" />
        <circle cx="32" cy="28" r="13" fill="#F4C09A" />
        {/* hair */}
        <path d="M18.6 28.5c-.9-9.6 5.4-16.5 13.6-16.5 8.6 0 14.6 6.4 13.2 16-1.2-4.6-4.8-8.4-10.6-9.1-3 3-8.4 4.4-13.2 4.1-1.6 1.5-2.6 3.4-3 5.5z" fill="#1F2937" />
        {/* eyes, smile, cheeks */}
        <circle cx="27" cy="29.5" r="1.7" fill="#1F2937" />
        <circle cx="37" cy="29.5" r="1.7" fill="#1F2937" />
        <path d="M27.8 34.2c2.4 2.4 6 2.4 8.4 0" fill="none" stroke="#1F2937" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="24.5" cy="33" r="1.8" fill="#F28B82" opacity=".45" />
        <circle cx="39.5" cy="33" r="1.8" fill="#F28B82" opacity=".45" />
      </g>
    </svg>
  );
}
