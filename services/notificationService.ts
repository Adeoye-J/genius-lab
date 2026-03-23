import mongoose from 'mongoose';
import { connectDB } from '@/lib/database/mongodb';
import Notification from '@/models/Notification';

export async function getUserNotifications(userId: string, unreadOnly = false) {
  await connectDB();
  const query: mongoose.FilterQuery<typeof Notification> = { userId };
  if (unreadOnly) query.read = false;
  return Notification.find(query).sort({ createdAt: -1 }).limit(50).lean();
}

export async function markNotificationsRead(userId: string, notificationIds?: string[]) {
  await connectDB();
  const query: mongoose.FilterQuery<typeof Notification> = { userId };
  if (notificationIds?.length) query._id = { $in: notificationIds };
  await Notification.updateMany(query, { $set: { read: true } });
}

export async function getUnreadCount(userId: string): Promise<number> {
  await connectDB();
  return Notification.countDocuments({ userId, read: false });
}