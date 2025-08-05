import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import {
  createTournamentApplication,
  getTournamentApplications,
} from '@/service/tournamentApplication';
import { getUserByEmail } from '@/service/user';
import {
  createNotification,
  createNotificationMessage,
  createNotificationStatuses,
} from '@/service/notification';

import { createNotificationLink } from '@/lib/notificationUtils';
import type { TournamentApplicationInput } from '@/model/tournamentApplication';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tournamentId = searchParams.get('tournamentId');
    const division = searchParams.get('division');

    if (!tournamentId) {
      return NextResponse.json({ error: '대회 ID가 필요합니다' }, { status: 400 });
    }

    const applications = await getTournamentApplications(tournamentId, division || undefined);
    return NextResponse.json(applications);
  } catch (error) {
    console.error('참가 신청 목록 조회 오류:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인 필요' }, { status: 401 });
    }

    const formData = await req.formData();

    // 기본 정보 파싱
    const tournamentId = formData.get('tournamentId') as string;
    const division = formData.get('division') as string;
    const tournamentType = formData.get('tournamentType') as 'individual' | 'team';
    const memo = formData.get('memo') as string;
    const isFeePaid = formData.get('isFeePaid') === 'true';

    if (!tournamentId || !division || !tournamentType) {
      return NextResponse.json({ error: '필수 정보 누락' }, { status: 400 });
    }

    // 대회 상태 확인
    const { getTournament } = await import('@/service/tournament');
    const tournament = await getTournament(tournamentId);

    if (!tournament) {
      return NextResponse.json({ error: '대회를 찾을 수 없습니다' }, { status: 404 });
    }

    if (tournament.status !== 'upcoming') {
      return NextResponse.json(
        { error: '예정 상태의 대회만 참가신청이 가능합니다' },
        { status: 400 },
      );
    }

    // 사용자 ID 조회
    const user = await getUserByEmail(session.user.email);
    if (!user?._id) {
      return NextResponse.json({ error: '유저 정보 없음' }, { status: 400 });
    }

    // 참가자 정보 파싱 - teamMembers 배열로 처리
    const teamMembers = [];
    const expectedMemberCount = tournamentType === 'individual' ? 2 : 8; // 단체전은 최대 8명

    for (let i = 1; i <= expectedMemberCount; i++) {
      const name = formData.get(`player${i}Name`) as string;
      const clubId = formData.get(`player${i}ClubId`) as string;
      const clubName = formData.get(`player${i}ClubName`) as string;
      const birth = formData.get(`player${i}Birth`) as string;
      const score = formData.get(`player${i}Score`) as string;
      const isRegistered = formData.get(`player${i}IsRegistered`) === 'true';

      // 빈 참가자 정보는 건너뛰기 (단체전에서 6-8명 선택 가능)
      if (!name || !clubId) {
        continue;
      }

      teamMembers.push({
        _key: `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        clubId,
        clubName,
        birth: birth || undefined,
        score: score ? parseInt(score) : undefined,
        isRegisteredMember: isRegistered,
      });
    }

    // 최소 참가자 수 검증
    const minMemberCount = tournamentType === 'individual' ? 2 : 6;
    if (teamMembers.length < minMemberCount) {
      return NextResponse.json(
        {
          error: `${tournamentType === 'individual' ? '개인전' : '단체전'}은 최소 ${minMemberCount}명의 참가자가 필요합니다.`,
        },
        { status: 400 },
      );
    }

    const applicationData: TournamentApplicationInput = {
      tournamentId,
      division,
      tournamentType,
      teamMembers,

      memo: memo || undefined,
      isFeePaid,
    };

    const result = await createTournamentApplication(applicationData, user._id);

    // 알림 생성 - 참가자 정보 포함
    const participantNames = teamMembers.map((member) => member.name).join(', ');
    const participantClubs = [...new Set(teamMembers.map((member) => member.clubName))].join(', ');

    const { title } = createNotificationMessage(
      'CREATE',
      'TOURNAMENT_APPLICATION',
      tournament.title,
    );

    // 상세한 생성 메시지 생성
    const detailedMessage = `${tournament.title} ${division}부 참가신청이 등록되었습니다.\n\n참가자: ${participantNames}\n참가클럽: ${participantClubs}`;

    const notification = await createNotification({
      type: 'CREATE',
      entityType: 'TOURNAMENT_APPLICATION',
      entityId: result._id!,
      title,
      message: detailedMessage,
      link: createNotificationLink('TOURNAMENT_APPLICATION', result._id!),
      requiredLevel: 4, // 레벨 4 (경기관리자)만 알림 수신
    });

    // 새로운 notificationStatus 구조에 맞게 알림 상태 생성
    await createNotificationStatuses(notification._id, undefined, 4);

    return NextResponse.json({ ok: true, id: result._id });
  } catch (error) {
    console.error('참가 신청 오류:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
