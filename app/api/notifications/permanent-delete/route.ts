import { NextRequest, NextResponse } from 'next/server';
import { withPermission } from '@/lib/apiUtils';
import { permanentlyDeleteAllNotifications } from '@/service/notification';

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

async function permanentlyDeleteAllNotificationsHandler() {
  try {
    // 모든 알림 완전 삭제 (관리자만 접근 가능)
    const result = await permanentlyDeleteAllNotifications();

    const response = NextResponse.json({
      success: true,
      message: '모든 알림이 완전히 삭제되었습니다',
      deletedCount: result.deletedCount,
    });
    return setCorsHeaders(response);
  } catch (error) {
    console.error('알림 완전 삭제 오류:', error);
    const response = NextResponse.json({ error: '서버 오류' }, { status: 500 });
    return setCorsHeaders(response);
  }
}

export async function DELETE(req: NextRequest) {
  // 관리자 권한 확인 (level 5 이상)
  return withPermission(req, 5, () => permanentlyDeleteAllNotificationsHandler());
}
