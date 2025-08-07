import { NextRequest, NextResponse } from 'next/server';
import { getTournaments, createTournament } from '@/service/tournament';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { parseTournamentFormData } from '@/lib/tournamentUtils';

import type { TournamentFormData } from '@/model/tournament';

// 대회 목록 조회
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userLevel = searchParams.get('userLevel');

    // 세션에서 사용자 정보 가져오기
    const session = await getServerSession(authOptions);
    const currentUserLevel = session?.user?.level || 0;

    // userLevel 파라미터가 있으면 그것을 사용, 없으면 세션의 레벨 사용
    const effectiveUserLevel = userLevel ? parseInt(userLevel) : currentUserLevel;

    const tournaments = await getTournaments(effectiveUserLevel);
    return NextResponse.json(tournaments);
  } catch (error) {
    console.error('대회 목록 조회 실패:', error);
    return NextResponse.json({ error: '대회 목록을 불러올 수 없습니다.' }, { status: 500 });
  }
}

// 대회 생성
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.name) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const formData = await req.formData();

    try {
      const tournamentData = parseTournamentFormData(formData);

      if (
        !tournamentData.title ||
        !tournamentData.startDate ||
        !tournamentData.endDate ||
        !tournamentData.location ||
        !tournamentData.tournamentType
      ) {
        return NextResponse.json({ error: '필수 필드가 누락되었습니다.' }, { status: 400 });
      }

      const tournament = await createTournament(
        tournamentData as TournamentFormData,
        session.user.name,
      );

      // 토너먼트 관련 알림 기능 제거 (새로운 알림 레벨 시스템에 따라)

      return NextResponse.json(tournament);
    } catch (error) {
      if (error instanceof Error && error.message.includes('참가부서 데이터')) {
        return NextResponse.json(
          { error: '참가부서 데이터 형식이 올바르지 않습니다.' },
          { status: 400 },
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('대회 생성 실패:', error);
    return NextResponse.json({ error: '대회를 생성할 수 없습니다.' }, { status: 500 });
  }
}
