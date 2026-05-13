import prisma from "../../lib/prisma";
import type { NotificationType } from "../../generated/prisma/client";

export type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
};

const create = async (input: CreateNotificationInput) => {
  return prisma.notification.create({
    data: {
      user_id: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link,
    },
  });
};

const listByUser = async (userId: string, limit = 20) => {
  return prisma.notification.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "desc" },
    take: limit,
  });
};

const markAsRead = async (id: string) => {
  return prisma.notification.update({
    where: { id },
    data: { read: true },
  });
};

const markAllRead = async (userId: string) => {
  return prisma.notification.updateMany({
    where: { user_id: userId, read: false },
    data: { read: true },
  });
};

const countUnread = async (userId: string) => {
  return prisma.notification.count({
    where: { user_id: userId, read: false },
  });
};

export const notificationRepository = {
  create,
  listByUser,
  markAsRead,
  markAllRead,
  countUnread,
};
