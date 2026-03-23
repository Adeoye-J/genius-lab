import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/auth';
import { getUserNotifications, markNotificationsRead, getUnreadCount } from '@/services/notificationService';
import { handleApiError } from '@/utils/errorHandler';

// GET /api/notifications?unreadOnly=true
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const unreadOnly = new URL(req.url).searchParams.get('unreadOnly') === 'true';
    const [notifications, unreadCount] = await Promise.all([
      getUserNotifications(user.id, unreadOnly),
      getUnreadCount(user.id),
    ]);
    return NextResponse.json({ success: true, data: { notifications, unreadCount } });
  } catch (error) {
    return handleApiError(error, 'GET /api/notifications');
  }
}

// PATCH /api/notifications — mark as read
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { ids } = await req.json().catch(() => ({}));
    await markNotificationsRead(user.id, ids);
    return NextResponse.json({ success: true, message: 'Notifications marked as read' });
  } catch (error) {
    return handleApiError(error, 'PATCH /api/notifications');
  }
}