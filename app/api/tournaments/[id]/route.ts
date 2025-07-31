import { NextRequest, NextResponse } from 'next/server';
import { getTournament, updateTournament, deleteTournament } from '@/service/tournament';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { parseTournamentFormData } from '@/lib/tournamentUtils';
import { createNotification, createNotificationMessage } from '@/service/notification';
import { createNotificationLink } from '@/lib/notificationUtils';

// 대회 개별 조회
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tournament = await getTournament(id);
    if (!tournament) {
      return NextResponse.json({ error: '대회를 찾을 수 없습니다.' }, { status: 404 });
    }
    return NextResponse.json(tournament);
  } catch (error) {
    console.error('대회 조회 실패:', error);
    return NextResponse.json({ error: '대회를 불러올 수 없습니다.' }, { status: 500 });
  }
}

// 대회 수정
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.name) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { id } = await params;
    const formData = await req.formData();

    try {
      const updateData = parseTournamentFormData(formData);

      if (
        !updateData.title ||
        !updateData.startDate ||
        !updateData.endDate ||
        !updateData.location ||
        !updateData.tournamentType
      ) {
        return NextResponse.json({ error: '필수 필드가 누락되었습니다.' }, { status: 400 });
      }

      const tournament = await updateTournament(id, updateData);

      // 토너먼트 수정 알림 생성 (모든 사용자가 받음)
      if (tournament._id) {
        const { title } = createNotificationMessage('UPDATE', 'TOURNAMENT', tournament.title);

        // 상세한 토너먼트 수정 메시지 생성
        const detailedMessage = `토너먼트 정보가 수정되었습니다.\n\n대회명: ${tournament.title}\n기간: ${tournament.startDate} ~ ${tournament.endDate}\n장소: ${tournament.location}\n대회 유형: ${tournament.tournamentType}\n수정자: ${session.user.name}`;

        await createNotification({
          type: 'UPDATE',
          entityType: 'TOURNAMENT',
          entityId: tournament._id,
          title,
          message: detailedMessage,
          link: createNotificationLink('TOURNAMENT', tournament._id),
          requiredLevel: 1, // 레벨 1 (클럽가입회원) 이상
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
    console.error('대회 수정 실패:', error);
    return NextResponse.json({ error: '대회를 수정할 수 없습니다.' }, { status: 500 });
  }
}

// 대회 삭제
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.name) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { id } = await params;

    // 삭제 전 토너먼트 정보 조회
    const tournament = await getTournament(id);
    if (!tournament) {
      return NextResponse.json({ error: '대회를 찾을 수 없습니다.' }, { status: 404 });
    }

    await deleteTournament(id);

    // 토너먼트 삭제 알림 생성 (모든 사용자가 받음)
    const { title } = createNotificationMessage('DELETE', 'TOURNAMENT', tournament.title);

    // 상세한 토너먼트 삭제 메시지 생성
    const detailedMessage = `토너먼트가 삭제되었습니다.\n\n대회명: ${tournament.title}\n기간: ${tournament.startDate} ~ ${tournament.endDate}\n장소: ${tournament.location}\n대회 유형: ${tournament.tournamentType}\n삭제자: ${session.user.name}`;

    await createNotification({
      type: 'DELETE',
      entityType: 'TOURNAMENT',
      entityId: id,
      title,
      message: detailedMessage,
      requiredLevel: 1, // 레벨 1 (클럽가입회원) 이상
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('대회 삭제 실패:', error);
    return NextResponse.json({ error: '대회를 삭제할 수 없습니다.' }, { status: 500 });
  }
}
