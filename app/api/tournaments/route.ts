import { NextRequest, NextResponse } from 'next/server';
import { getTournaments, createTournament } from '@/service/tournament';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { parseTournamentFormData } from '@/lib/tournamentUtils';
import { createNotification, createNotificationMessage } from '@/service/notification';
import { createNotificationLink } from '@/lib/notificationUtils';
import type { TournamentFormData } from '@/model/tournament';

// 대회 목록 조회
export async function GET() {
  try {
    const tournaments = await getTournaments();
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

      // 토너먼트 알림 생성 (모든 사용자가 받음)
      if (tournament._id) {
        const { title } = createNotificationMessage('CREATE', 'TOURNAMENT', tournamentData.title);

        // 상세한 토너먼트 메시지 생성
        const detailedMessage = `새로운 토너먼트가 등록되었습니다.\n\n대회명: ${tournamentData.title}\n기간: ${tournamentData.startDate} ~ ${tournamentData.endDate}\n장소: ${tournamentData.location}\n대회 유형: ${tournamentData.tournamentType}\n등록자: ${session.user.name}`;

        await createNotification({
          type: 'CREATE',
          entityType: 'TOURNAMENT',
          entityId: tournament._id,
          title,
          message: detailedMessage,
          link: createNotificationLink('TOURNAMENT', tournament._id),
        });
      }

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
