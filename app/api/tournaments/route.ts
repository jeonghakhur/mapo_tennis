import { NextRequest, NextResponse } from 'next/server';
import { getTournaments, createTournament } from '@/service/tournament';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

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
    const title = formData.get('title') as string;
    const startDate = formData.get('startDate') as string;
    const endDate = formData.get('endDate') as string;
    const location = formData.get('location') as string;
    const registrationStartDate = formData.get('registrationStartDate') as string;
    const registrationDeadline = formData.get('registrationDeadline') as string;
    const descriptionPostId = formData.get('descriptionPostId') as string;
    const rulesPostId = formData.get('rulesPostId') as string;

    if (!title || !startDate || !endDate || !location) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다.' }, { status: 400 });
    }

    const tournamentData = {
      title,
      startDate,
      endDate,
      location,
      registrationStartDate: registrationStartDate || undefined,
      registrationDeadline: registrationDeadline || undefined,
      descriptionPostId:
        descriptionPostId === 'null' || descriptionPostId === '' ? null : descriptionPostId,
      rulesPostId: rulesPostId === 'null' || rulesPostId === '' ? null : rulesPostId,
    };

    const tournament = await createTournament(tournamentData, session.user.name);
    return NextResponse.json(tournament);
  } catch (error) {
    console.error('대회 생성 실패:', error);
    return NextResponse.json({ error: '대회를 생성할 수 없습니다.' }, { status: 500 });
  }
}
