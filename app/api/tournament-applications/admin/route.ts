import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { getAllTournamentApplications } from '@/service/tournamentApplication';
import { getUserByEmail } from '@/service/user';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인 필요' }, { status: 401 });
    }

    const user = await getUserByEmail(session.user.email);
    if (!user?._id) {
      return NextResponse.json({ error: '유저 정보 없음' }, { status: 400 });
    }

    // 레벨 5 이상인 사용자만 관리자 권한
    if (!user.level || user.level < 5) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다' }, { status: 403 });
    }

    const applications = await getAllTournamentApplications();
    return NextResponse.json(applications);
  } catch (error) {
    console.error('관리자 참가 신청 목록 조회 오류:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
