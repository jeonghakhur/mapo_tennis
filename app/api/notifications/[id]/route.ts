import { NextRequest, NextResponse } from 'next/server';
import { markNotificationAsRead, deleteNotification } from '@/service/notification';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

// 알림 읽음 처리
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 인증 확인
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { id } = await params;

    await markNotificationAsRead(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('알림 읽음 처리 오류:', error);
    return NextResponse.json({ error: '알림 읽음 처리를 실패했습니다.' }, { status: 500 });
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
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { id } = await params;

    await deleteNotification(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('알림 삭제 오류:', error);
    return NextResponse.json({ error: '알림 삭제를 실패했습니다.' }, { status: 500 });
  }
}
