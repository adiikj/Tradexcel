import Image from "next/image";
import RemoteImage from "./RemoteImage";
import defaultAvatar from "../../assets/profile.png";

type AvatarProps = {
  src?: string | null;
  // Largest rendered size in CSS pixels; className controls the actual size.
  size: number;
  alt?: string;
  className?: string;
};

// A user's avatar, or the bundled default when they have none.
export default function Avatar({ src, size, alt = "", className }: AvatarProps) {
  return src ? (
    <RemoteImage src={src} alt={alt} width={size} height={size} className={className} />
  ) : (
    <Image src={defaultAvatar} alt={alt} width={size} height={size} className={className} />
  );
}
