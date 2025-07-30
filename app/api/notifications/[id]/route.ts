import { NextRequest, NextResponse } from 'next/server';
import { markNotificationAsRead, deleteNotification } from '@/service/notification';
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

// 알림 읽음 처리
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 인증 확인
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      const response = NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
      return setCorsHeaders(response);
    }

    const { id } = await params;

    await markNotificationAsRead(id);

    const response = NextResponse.json({ success: true });
    return setCorsHeaders(response);
  } catch (error) {
    console.error('알림 읽음 처리 오류:', error);
    const response = NextResponse.json(
      { error: '알림 읽음 처리를 실패했습니다.' },
      { status: 500 },
    );
    return setCorsHeaders(response);
  }
}

// 알림 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // 인증 확인
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      const response = NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
      return setCorsHeaders(response);
    }

    const { id } = await params;

    await deleteNotification(id);

    const response = NextResponse.json({ success: true });
    return setCorsHeaders(response);
  } catch (error) {
    console.error('알림 삭제 오류:', error);
    const response = NextResponse.json({ error: '알림 삭제를 실패했습니다.' }, { status: 500 });
    return setCorsHeaders(response);
  }
}
