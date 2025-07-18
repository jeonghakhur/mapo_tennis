import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import {
  deleteTournamentApplication,
  getTournamentApplication,
} from '@/service/tournamentApplication';
import { getUserByEmail } from '@/service/user';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인 필요' }, { status: 401 });
    }

    const { id } = await params;
    const user = await getUserByEmail(session.user.email);
    if (!user?._id) {
      return NextResponse.json({ error: '유저 정보 없음' }, { status: 400 });
    }

    // 레벨 5 이상인 사용자만 삭제 권한
    if (!user.level || user.level < 5) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다' }, { status: 403 });
    }

    // 참가신청 존재 여부 확인
    const application = await getTournamentApplication(id);
    if (!application) {
      return NextResponse.json({ error: '참가신청을 찾을 수 없습니다' }, { status: 404 });
    }

    await deleteTournamentApplication(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('참가신청 삭제 오류:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
