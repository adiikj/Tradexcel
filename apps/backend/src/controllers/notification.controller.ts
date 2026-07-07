import { Response } from "express";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import prisma from "../db/prisma.js";

interface AuthRequest {
  user?: { id: string };
  query: any;
}

const getNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { actor: { select: { id: true, name: true, username: true, avatar: true } } },
    }),
    prisma.notification.count({ where: { userId, read: false } }),
  ]);

  return res.status(200).json(
    new ApiResponse(200, "Notifications fetched successfully", {
      notifications,
      unreadCount,
    })
  );
});

const markNotificationsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });

  return res.status(200).json(new ApiResponse(200, "Notifications marked as read", null));
});

export { getNotifications, markNotificationsRead };
