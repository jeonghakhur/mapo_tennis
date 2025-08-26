import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { client } from '@/sanity/lib/client';
import { hasPermissionLevel } from '@/lib/authUtils';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    // 관리자 권한 확인
    const user = await client.fetch(`*[_type == "user" && email == $email][0]`, {
      email: session.user.email,
    });

    if (!user || !hasPermissionLevel(user, 4)) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const { seedNumber } = await request.json();

    // 시드 삭제 (0 입력) 또는 유효한 시드 번호 확인
    if (typeof seedNumber !== 'number' || seedNumber < 0) {
      return NextResponse.json(
        { error: '유효한 시드 번호를 입력해주세요. (0: 시드 삭제, 1 이상: 시드 등록)' },
        { status: 400 },
      );
    }

    // 시드 삭제인 경우 (seedNumber가 0)
    if (seedNumber === 0) {
      const updatedApplication = await client.patch(id).unset(['seed']).commit();

      // 업데이트된 전체 데이터 조회
      const fullApplication = await client.fetch(
        `*[_type == "tournamentApplication" && _id == $id][0] {
          _id,
          _type,
          tournamentId,
          division,
          tournamentType,
          seed,
          teamMembers,
          status,
          memo,
          isFeePaid,
          createdAt,
          updatedAt,
          createdBy
        }`,
        { id },
      );

      return NextResponse.json(fullApplication);
    }

    // 동일한 대회의 동일한 부서에서 중복 시드 번호 확인
    const currentApplication = await client.fetch(
      `*[_type == "tournamentApplication" && _id == $id][0] {
        tournamentId,
        division
      }`,
      { id },
    );

    if (!currentApplication) {
      return NextResponse.json({ error: '신청 내역을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 시드 번호가 1 이상인 경우에만 중복 검사
    if (seedNumber >= 1) {
      // 동일한 대회, 동일한 부서에서 같은 시드 번호가 이미 사용되고 있는지 확인
      const existingSeed = await client.fetch(
        `*[_type == "tournamentApplication" && tournamentId == $tournamentId && division == $division && seed == $seedNumber && _id != $id][0] {
          _id,
          "applicantName": teamMembers[0].name
        }`,
        {
          tournamentId: currentApplication.tournamentId,
          division: currentApplication.division,
          seedNumber,
          id,
        },
      );

      if (existingSeed) {
        return NextResponse.json(
          {
            error: `시드 ${seedNumber}번은 이미 ${existingSeed.applicantName}님이 사용 중입니다.`,
          },
          { status: 400 },
        );
      }
    }

    // 시드 번호 업데이트
    const updatedApplication = await client.patch(id).set({ seed: seedNumber }).commit();

    // 업데이트된 전체 데이터 조회
    const fullApplication = await client.fetch(
      `*[_type == "tournamentApplication" && _id == $id][0] {
        _id,
        _type,
        tournamentId,
        division,
        tournamentType,
        seed,
        teamMembers,
        status,
        memo,
        isFeePaid,
        createdAt,
        updatedAt,
        createdBy
      }`,
      { id },
    );

    return NextResponse.json(fullApplication);
  } catch (error) {
    console.error('시드 등록 오류:', error);
    return NextResponse.json({ error: '시드 등록 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
