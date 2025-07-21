import { NextRequest, NextResponse } from 'next/server';
import {
  getTournamentApplication,
  updateTournamentApplication,
  updateTournamentApplicationStatus,
  deleteTournamentApplication,
} from '@/service/tournamentApplication';
import {
  createNotification,
  createTournamentApplicationStatusMessage,
  createNotificationMessage,
  trackChanges,
} from '@/service/notification';
import { getTournament } from '@/service/tournament';
import {
  authenticateUser,
  checkTournamentApplicationPermission,
  getNotificationUserId,
} from '@/lib/apiUtils';
import { createNotificationLink } from '@/lib/notificationUtils';
import type { TournamentApplicationInput } from '@/model/tournamentApplication';

// 참가신청 조회
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await authenticateUser();
    if (authResult.error) return authResult.error;

    const { id } = await params;
    const application = await getTournamentApplication(id);
    if (!application) {
      return NextResponse.json({ error: '참가신청을 찾을 수 없습니다' }, { status: 404 });
    }

    const permissionResult = checkTournamentApplicationPermission(
      authResult.user,
      application,
      'read',
    );
    if (permissionResult.error) return permissionResult.error;

    return NextResponse.json(application);
  } catch (error) {
    console.error('참가신청 조회 오류:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

// 참가신청 수정
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await authenticateUser();
    if (authResult.error) return authResult.error;

    const { id } = await params;
    const existingApplication = await getTournamentApplication(id);
    if (!existingApplication) {
      return NextResponse.json({ error: '참가신청을 찾을 수 없습니다' }, { status: 404 });
    }

    const permissionResult = checkTournamentApplicationPermission(
      authResult.user,
      existingApplication,
      'update',
    );
    if (permissionResult.error) return permissionResult.error;

    const formData = await req.formData();

    // 기본 정보 파싱
    const division = formData.get('division') as string;
    const tournamentType = formData.get('tournamentType') as 'individual' | 'team';
    const contact = formData.get('contact') as string;
    const email = formData.get('email') as string;
    const memo = formData.get('memo') as string;
    const isFeePaid = formData.get('isFeePaid') === 'true';

    if (!division || !tournamentType || !contact) {
      return NextResponse.json({ error: '필수 정보 누락' }, { status: 400 });
    }

    // 참가자 정보 파싱 - teamMembers 배열로 처리
    const teamMembers = [];
    const expectedMemberCount = tournamentType === 'individual' ? 2 : 8;

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

    const applicationData: Partial<TournamentApplicationInput> = {
      division,
      tournamentType,
      teamMembers,
      contact,
      email: email || undefined,
      memo: memo || undefined,
      isFeePaid,
    };

    const result = await updateTournamentApplication(id, applicationData);

    // 대회 정보 조회
    const tournament = await getTournament(existingApplication.tournamentId);
    if (tournament) {
      // 변경사항 추적
      const changes = trackChanges(
        existingApplication as unknown as Record<string, unknown>,
        result as unknown as Record<string, unknown>,
      );

      if (changes.length > 0) {
        // 참가신청 수정 알림 생성 - 참가자 정보 포함
        const participantNames = teamMembers.map((member) => member.name).join(', ');
        const participantClubs = [...new Set(teamMembers.map((member) => member.clubName))].join(
          ', ',
        );

        const { title } = createNotificationMessage(
          'UPDATE',
          'TOURNAMENT_APPLICATION',
          `${tournament.title} ${division}부 참가신청`,
        );

        // 상세한 수정 메시지 생성
        const detailedMessage = `${tournament.title} ${division}부 참가신청이 수정되었습니다.\n\n참가자: ${participantNames}\n참가클럽: ${participantClubs}`;

        await createNotification({
          type: 'UPDATE',
          entityType: 'TOURNAMENT_APPLICATION',
          entityId: id,
          title,
          message: detailedMessage,
          link: createNotificationLink('TOURNAMENT_APPLICATION', id),
          changes,
          userId: getNotificationUserId(
            Boolean(permissionResult.isAdmin),
            existingApplication.createdBy,
          ),
        });
      }
    }

    return NextResponse.json({ ok: true, id: result._id });
  } catch (error) {
    console.error('참가신청 수정 오류:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

// 참가신청 상태 변경
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await authenticateUser();
    if (authResult.error) return authResult.error;

    const { id } = await params;
    const existingApplication = await getTournamentApplication(id);
    if (!existingApplication) {
      return NextResponse.json({ error: '참가신청을 찾을 수 없습니다' }, { status: 404 });
    }

    const { status } = await req.json();

    if (!status || !['pending', 'approved', 'rejected', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: '유효하지 않은 상태입니다' }, { status: 400 });
    }

    // 상태가 변경되지 않은 경우 알림 생성하지 않음
    if (existingApplication.status === status) {
      return NextResponse.json({ ok: true, id: existingApplication._id });
    }

    // 대회 정보 조회
    const tournament = await getTournament(existingApplication.tournamentId);
    if (!tournament) {
      return NextResponse.json({ error: '대회 정보를 찾을 수 없습니다' }, { status: 404 });
    }

    // 참가신청 상태 업데이트
    const result = await updateTournamentApplicationStatus(id, status);

    // 알림 생성
    const { title, message } = createTournamentApplicationStatusMessage(
      existingApplication.status,
      status,
      tournament.title,
      existingApplication.division,
    );

    await createNotification({
      type: 'UPDATE',
      entityType: 'TOURNAMENT_APPLICATION',
      entityId: id,
      title,
      message,
      link: createNotificationLink('TOURNAMENT_APPLICATION', id),
      changes: [
        {
          field: '상태',
          oldValue: existingApplication.status,
          newValue: status,
        },
      ],
      userId: existingApplication.createdBy, // 신청자에게만 알림
    });

    return NextResponse.json({ ok: true, id: result._id });
  } catch (error) {
    console.error('참가신청 상태 변경 오류:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

// 참가신청 삭제
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await authenticateUser();
    if (authResult.error) return authResult.error;

    const { id } = await params;
    const existingApplication = await getTournamentApplication(id);
    if (!existingApplication) {
      return NextResponse.json({ error: '참가신청을 찾을 수 없습니다' }, { status: 404 });
    }

    const permissionResult = checkTournamentApplicationPermission(
      authResult.user,
      existingApplication,
      'delete',
    );
    if (permissionResult.error) return permissionResult.error;

    // 대회 정보 조회
    const tournament = await getTournament(existingApplication.tournamentId);
    if (!tournament) {
      return NextResponse.json({ error: '대회 정보를 찾을 수 없습니다' }, { status: 404 });
    }

    // 삭제 전에 알림 생성 - 참가자 정보 포함
    const participantNames = existingApplication.teamMembers
      .map((member) => member.name)
      .join(', ');
    const participantClubs = [
      ...new Set(existingApplication.teamMembers.map((member) => member.clubName)),
    ].join(', ');

    const { title } = createNotificationMessage(
      'DELETE',
      'TOURNAMENT_APPLICATION',
      `${tournament.title} ${existingApplication.division}부 참가신청`,
    );

    // 상세한 삭제 메시지 생성
    const detailedMessage = `${tournament.title} ${existingApplication.division}부 참가신청이 삭제되었습니다.\n\n참가자: ${participantNames}\n참가클럽: ${participantClubs}`;

    await createNotification({
      type: 'DELETE',
      entityType: 'TOURNAMENT_APPLICATION',
      entityId: id,
      title,
      message: detailedMessage,
      userId: getNotificationUserId(
        Boolean(permissionResult.isAdmin),
        existingApplication.createdBy,
      ),
    });

    // 참가신청 삭제
    await deleteTournamentApplication(id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('참가신청 삭제 오류:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
