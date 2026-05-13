import { notificationRepository, type CreateNotificationInput } from "./notification.repository";

const createNotification = async (input: CreateNotificationInput) => {
  return notificationRepository.create(input);
};

const getUserNotifications = async (userId: string) => {
  const [notifications, unreadCount] = await Promise.all([
    notificationRepository.listByUser(userId),
    notificationRepository.countUnread(userId),
  ]);

  return { notifications, unreadCount };
};

const markRead = async (id: string) => {
  return notificationRepository.markAsRead(id);
};

const markAllRead = async (userId: string) => {
  await notificationRepository.markAllRead(userId);
};

export const notificationService = {
  createNotification,
  getUserNotifications,
  markRead,
  markAllRead,
};
