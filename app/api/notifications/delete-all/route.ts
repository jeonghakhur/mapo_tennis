import { NextRequest, NextResponse } from 'next/server';
import { withPermission } from '@/lib/apiUtils';
import { deleteAllNotifications } from '@/service/notification';

async function deleteAllNotificationsHandler() {
  try {
    // 모든 알림 삭제
    const result = await deleteAllNotifications();

    return NextResponse.json({
      success: true,
      message: '모든 알림이 삭제되었습니다',
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('알림 일괄 삭제 오류:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  // 관리자 권한 확인 (level 5 이상)
  return withPermission(req, 5, () => deleteAllNotificationsHandler());
}
