"use client";
import React, { useState } from "react";
import { followUser, unfollowUser } from "../../api/api";
import { apiErrorMessage } from "../../api/http";

interface FollowButtonProps {
  username: string;
  initialIsFollowing: boolean;
  onChange?: (isFollowing: boolean) => void;
}

function FollowButton({ username, initialIsFollowing, onChange }: FollowButtonProps) {
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
    } catch (err) {
      alert(apiErrorMessage(err, "Something went wrong. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors duration-200 disabled:opacity-60 ${
        isFollowing
          ? "ring-1 ring-gray-200 hover:bg-red-50 hover:text-red-600 hover:ring-red-200 dark:ring-gray-700 dark:hover:bg-red-500/10 dark:hover:text-red-300 dark:hover:ring-red-500/30"
          : "bg-blue-600 text-white hover:bg-blue-700"
      }`}
    >
      {isLoading ? "…" : isFollowing ? "Following" : "Follow"}
    </button>
  );
}

export default FollowButton;
