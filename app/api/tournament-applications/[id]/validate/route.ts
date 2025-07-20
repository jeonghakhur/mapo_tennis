import { NextRequest, NextResponse } from 'next/server';
import {
  getTournamentApplication,
  updateTournamentApplication,
} from '@/service/tournamentApplication';
import { searchClubMemberByName } from '@/service/tournamentApplication';
import { authenticateUser, checkTournamentApplicationPermission } from '@/lib/apiUtils';

// 참가자 정보 검증
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await authenticateUser();
    if (authResult.error) return authResult.error;

    const { id } = await params;
    const existingApplication = await getTournamentApplication(id);
    if (!existingApplication) {
      return NextResponse.json({ error: '참가신청을 찾을 수 없습니다' }, { status: 404 });
    }

    // 관리자 권한 확인
    const permissionResult = checkTournamentApplicationPermission(
      authResult.user,
      existingApplication,
      'update',
    );
    if (permissionResult.error) return permissionResult.error;

    const { memberIndex } = await req.json();

    if (
      memberIndex === undefined ||
      memberIndex < 0 ||
      memberIndex >= existingApplication.teamMembers.length
    ) {
      return NextResponse.json({ error: '유효하지 않은 참가자 인덱스입니다' }, { status: 400 });
    }

    const member = existingApplication.teamMembers[memberIndex];

    // 클럽 회원 검색
    const clubMember = await searchClubMemberByName(member.name, member.clubId);

    // 참가자 정보 업데이트
    const updatedTeamMembers = [...existingApplication.teamMembers];
    updatedTeamMembers[memberIndex] = {
      ...member,
      isInfoValid: !!clubMember, // 등록된 회원이면 true, 아니면 false
    };

    await updateTournamentApplication(id, {
      teamMembers: updatedTeamMembers,
    });

    return NextResponse.json({
      ok: true,
      memberIndex,
      isInfoValid: !!clubMember,
    });
  } catch (error) {
    console.error('참가자 정보 검증 오류:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

// 모든 참가자 정보 일괄 검증
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await authenticateUser();
    if (authResult.error) return authResult.error;

    const { id } = await params;
    const existingApplication = await getTournamentApplication(id);
    if (!existingApplication) {
      return NextResponse.json({ error: '참가신청을 찾을 수 없습니다' }, { status: 404 });
    }

    // 관리자 권한 확인
    const permissionResult = checkTournamentApplicationPermission(
      authResult.user,
      existingApplication,
      'update',
    );
    if (permissionResult.error) return permissionResult.error;

    const updatedTeamMembers = [];

    // 모든 참가자 정보 검증
    for (const member of existingApplication.teamMembers) {
      const clubMember = await searchClubMemberByName(member.name, member.clubId);

      updatedTeamMembers.push({
        ...member,
        isInfoValid: !!clubMember, // 등록된 회원이면 true, 아니면 false
      });
    }

    await updateTournamentApplication(id, {
      teamMembers: updatedTeamMembers,
    });

    return NextResponse.json({
      ok: true,
      validatedCount: updatedTeamMembers.length,
    });
  } catch (error) {
    console.error('참가자 정보 일괄 검증 오류:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
