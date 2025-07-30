import { NextRequest, NextResponse } from 'next/server';
import { getNotifications, getUnreadNotificationCount } from '@/service/notification';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

// CORS 헤더 설정 함수
function setCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

// OPTIONS 요청 처리 (CORS preflight)
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  return setCorsHeaders(response);
}

// 알림 목록 조회
export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      const response = NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
      return setCorsHeaders(response);
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || undefined;

    const notifications = await getNotifications(userId);
    const unreadCount = await getUnreadNotificationCount(userId);

    const response = NextResponse.json({
      notifications,
      unreadCount,
    });
    return setCorsHeaders(response);
  } catch (error) {
    console.error('알림 조회 오류:', error);
    const response = NextResponse.json({ error: '알림을 불러오지 못했습니다.' }, { status: 500 });
    return setCorsHeaders(response);
  }
}
