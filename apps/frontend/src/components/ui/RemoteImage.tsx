import Image, { type ImageProps } from "next/image";

// Must match images.remotePatterns in next.config.mjs.
const OPTIMIZED_HOSTS = [/^res\.cloudinary\.com$/, /\.googleusercontent\.com$/, /^s\.yimg\.com$/];

function isOptimizable(src: string) {
  try {
    const { protocol, hostname } = new URL(src);
    return protocol === "https:" && OPTIMIZED_HOSTS.some((host) => host.test(hostname));
  } catch {
    return false;
  }
}

type RemoteImageProps = Omit<ImageProps, "src"> & { src: string };

// next/image for user/content URLs (avatars, contest banners, thumbnails).
// Known hosts are resized and served as WebP/AVIF; any other URL (older data,
// blob: previews) falls back to unoptimized so an unexpected host can never
// crash the page.
export default function RemoteImage({ src, alt, ...props }: RemoteImageProps) {
  return <Image src={src} alt={alt} unoptimized={!isOptimizable(src)} {...props} />;
}
