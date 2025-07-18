import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import {
  getTournamentApplication,
  updateTournamentApplication,
} from '@/service/tournamentApplication';
import { getUserByEmail } from '@/service/user';
import type { TournamentApplicationInput } from '@/model/tournamentApplication';

// 참가신청 조회
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인 필요' }, { status: 401 });
    }

    const { id } = await params;
    const application = await getTournamentApplication(id);
    if (!application) {
      return NextResponse.json({ error: '참가신청을 찾을 수 없습니다' }, { status: 404 });
    }

    // 사용자 정보 조회
    const user = await getUserByEmail(session.user.email);
    if (!user?._id) {
      return NextResponse.json({ error: '유저 정보 없음' }, { status: 400 });
    }

    // 관리자(레벨 5 이상) 또는 본인이 작성한 신청만 조회 가능
    const isAdmin = user.level && user.level >= 5;
    if (!isAdmin && application.createdBy !== user._id) {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 });
    }

    return NextResponse.json(application);
  } catch (error) {
    console.error('참가신청 조회 오류:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

// 참가신청 수정
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인 필요' }, { status: 401 });
    }

    const { id } = await params;
    const user = await getUserByEmail(session.user.email);
    if (!user?._id) {
      return NextResponse.json({ error: '유저 정보 없음' }, { status: 400 });
    }

    // 기존 신청 조회
    const existingApplication = await getTournamentApplication(id);
    if (!existingApplication) {
      return NextResponse.json({ error: '참가신청을 찾을 수 없습니다' }, { status: 404 });
    }

    // 관리자(레벨 5 이상) 또는 본인이 작성한 신청만 수정 가능
    const isAdmin = user.level && user.level >= 5;
    if (!isAdmin && existingApplication.createdBy !== user._id) {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 });
    }

    // 일반 사용자는 승인된 신청 수정 불가
    if (!isAdmin && existingApplication.status === 'approved') {
      return NextResponse.json({ error: '승인된 신청은 수정할 수 없습니다' }, { status: 400 });
    }

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

    console.log('참가신청 수정 데이터:', applicationData);
    const result = await updateTournamentApplication(id, applicationData);
    console.log('참가신청 수정 결과:', result);
    return NextResponse.json({ ok: true, id: result._id });
  } catch (error) {
    console.error('참가신청 수정 오류:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
