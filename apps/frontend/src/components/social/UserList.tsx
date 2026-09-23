"use client";
import React from "react";
import Link from "next/link";
import FollowButton from "./FollowButton";
import Avatar from "../ui/Avatar";

interface SocialUser {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  isFollowing?: boolean;
}

interface UserListProps {
  users: SocialUser[];
  emptyLabel: string;
}

function UserList({ users, emptyLabel }: UserListProps) {
  if (users.length === 0) {
    return <p className="text-sm text-gray-400 py-6 text-center">{emptyLabel}</p>;
  }

  return (
    <ul className="divide-y divide-gray-500/10">
      {users.map((user) => (
        <li key={user.id} className="flex items-center justify-between py-3">
          <Link href={`/u/${user.username}`} className="flex items-center gap-3 min-w-0">
            <Avatar src={user.avatar} size={40} className="w-10 h-10 rounded-full shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{user.name}</p>
              <p className="text-xs text-gray-400 truncate">@{user.username}</p>
            </div>
          </Link>
          <FollowButton username={user.username} initialIsFollowing={user.isFollowing ?? false} />
        </li>
      ))}
    </ul>
  );
}

export default UserList;
