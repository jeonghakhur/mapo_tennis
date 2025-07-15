import { NextRequest, NextResponse } from 'next/server';
import { getNotifications, getUnreadNotificationCount } from '@/service/notification';

// 알림 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || undefined;

    const notifications = await getNotifications(userId);
    const unreadCount = await getUnreadNotificationCount(userId);

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('알림 조회 오류:', error);
    return NextResponse.json({ error: '알림을 불러오지 못했습니다.' }, { status: 500 });
  }
}
