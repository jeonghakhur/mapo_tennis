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
  createNotificationStatuses,
} from '@/service/notification';
import { getTournament } from '@/service/tournament';
import { authenticateUser, checkTournamentApplicationPermission } from '@/lib/apiUtils';
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
    const memo = formData.get('memo') as string;
    const isFeePaid = formData.get('isFeePaid') === 'true';

    if (!division || !tournamentType) {
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

      // 기존 참가신청에서 같은 순서의 참가자 _key 재사용
      const existingMember = existingApplication.teamMembers[i - 1];
      const _key =
        existingMember?._key || `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      teamMembers.push({
        _key,
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

      memo: memo,
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

        const notification = await createNotification({
          type: 'UPDATE',
          entityType: 'TOURNAMENT_APPLICATION',
          entityId: id,
          title,
          message: detailedMessage,
          link: createNotificationLink('TOURNAMENT_APPLICATION', id),
          changes,
          requiredLevel: 4, // 레벨 4 (경기관리자) 이상
        });

        // 새로운 notificationStatus 구조에 맞게 알림 상태 생성
        await createNotificationStatuses(notification._id, undefined, 4);
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

    // 관리자 권한 확인 (레벨 4 이상만 상태 변경 가능)
    if (!authResult.user.level || authResult.user.level < 4) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다' }, { status: 403 });
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

    // 알림 생성 (오류가 발생해도 상태 업데이트는 성공)
    try {
      const { title, message } = createTournamentApplicationStatusMessage(
        existingApplication.status,
        status,
        tournament.title,
        existingApplication.division,
      );

      const notification = await createNotification({
        type: 'UPDATE',
        entityType: 'TOURNAMENT_APPLICATION',
        entityId: id,
        title,
        message,
        link: createNotificationLink('TOURNAMENT_APPLICATION', id),
        requiredLevel: 4, // 레벨 4 (경기관리자) 이상
      });

      // 새로운 notificationStatus 구조에 맞게 알림 상태 생성
      // 신청자에게만 알림을 보내기 위해 targetUserIds 사용
      await createNotificationStatuses(notification._id, [existingApplication.createdBy], 4);
    } catch (notificationError) {
      console.error('알림 생성 중 오류 발생:', notificationError);
      // 알림 생성 실패는 상태 업데이트 성공을 방해하지 않음
    }

    return NextResponse.json({ ok: true, id: result._id });
  } catch (error) {
    console.error('참가신청 상태 변경 오류:', error);
    console.error('에러 스택:', error instanceof Error ? error.stack : '스택 없음');
    return NextResponse.json(
      {
        error: '서버 오류',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 },
    );
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

    const notification = await createNotification({
      type: 'DELETE',
      entityType: 'TOURNAMENT_APPLICATION',
      entityId: id,
      title,
      message: detailedMessage,
      requiredLevel: 4, // 레벨 4 (경기관리자) 이상
    });

    // 새로운 notificationStatus 구조에 맞게 알림 상태 생성
    await createNotificationStatuses(notification._id, undefined, 4);

    // 참가신청 삭제
    await deleteTournamentApplication(id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('참가신청 삭제 오류:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
