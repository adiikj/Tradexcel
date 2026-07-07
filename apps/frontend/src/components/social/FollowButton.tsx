"use client";
import React, { useState } from "react";
import { followUser, unfollowUser } from "../../api/api";

interface FollowButtonProps {
  username: string;
  initialIsFollowing: boolean;
  darkMode?: boolean;
  onChange?: (isFollowing: boolean) => void;
}

function FollowButton({ username, initialIsFollowing, darkMode, onChange }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser(username);
        setIsFollowing(false);
        onChange?.(false);
      } else {
        await followUser(username);
        setIsFollowing(true);
        onChange?.(true);
      }
    } catch (err: any) {
      alert(err.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors duration-200 disabled:opacity-60 ${
        isFollowing
          ? darkMode
            ? "bg-gray-700 text-gray-200 hover:bg-red-900 hover:text-red-300"
            : "bg-gray-200 text-gray-800 hover:bg-red-100 hover:text-red-600"
          : "bg-blue-500 text-white hover:bg-blue-600"
      }`}
    >
      {isLoading ? "..." : isFollowing ? "Following" : "Follow"}
    </button>
  );
}

export default FollowButton;
