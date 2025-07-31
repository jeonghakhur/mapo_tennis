import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { deleteUser, getUserByEmail } from '@/service/user';
import { createNotification } from '@/service/notification';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { reason } = await request.json();
    const email = session.user.email;

    // 탈퇴 전에 사용자 정보 조회
    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    if (!user._id) {
      return NextResponse.json({ error: '사용자 ID가 없습니다.' }, { status: 404 });
    }

    // 관리자에게 탈퇴 알림 생성 (관리자 전용)
    try {
      await createNotification({
        type: 'DELETE',
        entityType: 'USER',
        entityId: user._id,
        title: '회원 탈퇴',
        message: `${user.name}(${email})님이 회원 탈퇴를 요청했습니다.${reason ? ` 탈퇴 사유: ${reason}` : ''}`,
        requiredLevel: 5, // 최고 관리자 레벨만 알림 (관리자 전용)
        // userId를 설정하지 않음으로써 개인 알림이 아닌 레벨별 알림으로 처리
      });
    } catch (notificationError) {
      console.error('탈퇴 알림 생성 중 오류:', notificationError);
      // 알림 생성 실패는 탈퇴를 막지 않음
    }

    // 사용자 삭제
    await deleteUser(email);

    // 탈퇴 로그 기록
    console.log(`User ${email} withdrew from the service. Reason: ${reason || 'Not provided'}`);

    return NextResponse.json({ message: '회원 탈퇴가 완료되었습니다.' });
  } catch (error) {
    console.error('회원 탈퇴 중 오류:', error);
    return NextResponse.json({ error: '회원 탈퇴 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
