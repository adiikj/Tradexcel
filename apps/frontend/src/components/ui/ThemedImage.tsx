import Image, { type StaticImageData } from "next/image";

type ThemedImageProps = {
  light: StaticImageData;
  dark: StaticImageData;
  alt: string;
  className?: string;
};

// Picks the light/dark variant of an image with CSS (`dark:`), so the right one
// shows on first paint instead of swapping after the theme loads. Put
// responsive show/hide classes on a wrapper, not in className.
export default function ThemedImage({ light, dark, alt, className = "" }: ThemedImageProps) {
  return (
    <>
      <Image src={light} alt={alt} className={`${className} dark:hidden`} />
      <Image src={dark} alt={alt} className={`${className} hidden dark:inline-block`} />
    </>
  );
}
