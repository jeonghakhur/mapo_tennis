import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { getTournament, updateTournament } from '@/service/tournament';
import { createNotification, createNotificationMessage } from '@/service/notification';
import { createNotificationLink } from '@/lib/notificationUtils';
import { getTournamentTypeLabel } from '@/lib/tournamentUtils';

// 대회 게시/임시저장 토글
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.name) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { id } = await params;
    const { isDraft } = await req.json();

    // 대회 정보 조회
    const tournament = await getTournament(id);
    if (!tournament) {
      return NextResponse.json({ error: '대회를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 대회 상태 토글
    const updatedTournament = await updateTournament(id, {
      isDraft: isDraft,
    });

    // 게시될 때만 알림 생성 (임시저장 → 게시)
    if (!isDraft && tournament.isDraft) {
      const { title } = createNotificationMessage('CREATE', 'TOURNAMENT', tournament.title);

      const detailedMessage = `새로운 대회가 게시되었습니다.\n대회명: ${tournament.title}(${getTournamentTypeLabel(tournament.tournamentType)})\n기간: ${tournament.startDate} ~ ${tournament.endDate}\n장소: ${tournament.location}}`;

      await createNotification({
        type: 'CREATE',
        entityType: 'TOURNAMENT',
        entityId: id,
        title,
        message: detailedMessage,
        link: createNotificationLink('TOURNAMENT', id),
        requiredLevel: 1, // 레벨 1 (클럽가입회원) 이상
      });
    }

    return NextResponse.json(updatedTournament);
  } catch (error) {
    console.error('대회 상태 변경 실패:', error);
    return NextResponse.json({ error: '대회 상태를 변경할 수 없습니다.' }, { status: 500 });
  }
}
