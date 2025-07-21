import { NextRequest, NextResponse } from 'next/server';
import { markAllNotificationsAsRead } from '@/service/notification';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

// 모든 알림 읽음 처리
export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || undefined;

    await markAllNotificationsAsRead(userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('모든 알림 읽음 처리 오류:', error);
    return NextResponse.json({ error: '모든 알림 읽음 처리를 실패했습니다.' }, { status: 500 });
  }
}
