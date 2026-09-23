import React from "react";
import Image, { type StaticImageData } from "next/image";

function BrowserFrame({
  src,
  alt,
  className = "",
}: {
  src: StaticImageData;
  alt: string;
  className?: string;
}) {
  return (
    <div
      className={`w-full rounded-xl border border-gray-200 shadow-2xl shadow-gray-300/50 overflow-hidden bg-white ${className}`}
    >
      <div className="flex items-center gap-1.5 px-3.5 py-2.5 bg-gray-100 border-b border-gray-200">
        <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
      </div>
      <Image src={src} alt={alt} sizes="(min-width: 1024px) 50vw, 100vw" className="w-full h-auto block" />
    </div>
  );
}

export default BrowserFrame;
