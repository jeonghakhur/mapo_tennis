import { NextRequest, NextResponse } from 'next/server';
import { getTournament, updateTournament, deleteTournament } from '@/service/tournament';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

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
    const title = formData.get('title') as string;
    const startDate = formData.get('startDate') as string;
    const endDate = formData.get('endDate') as string;
    const location = formData.get('location') as string;
    const registrationStartDate = formData.get('registrationStartDate') as string;
    const registrationDeadline = formData.get('registrationDeadline') as string;
    const descriptionPostId = formData.get('descriptionPostId') as string;
    const rulesPostId = formData.get('rulesPostId') as string;
    const status = formData.get('status') as string;

    if (!title || !startDate || !endDate || !location) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다.' }, { status: 400 });
    }

    const updateData = {
      title,
      startDate,
      endDate,
      location,
      status: status as 'upcoming' | 'ongoing' | 'completed' | 'cancelled',
      registrationStartDate: registrationStartDate || undefined,
      registrationDeadline: registrationDeadline || undefined,
      descriptionPostId:
        descriptionPostId === 'null' || descriptionPostId === '' ? null : descriptionPostId,
      rulesPostId: rulesPostId === 'null' || rulesPostId === '' ? null : rulesPostId,
    };

    const tournament = await updateTournament(id, updateData);
    return NextResponse.json(tournament);
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
    await deleteTournament(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('대회 삭제 실패:', error);
    return NextResponse.json({ error: '대회를 삭제할 수 없습니다.' }, { status: 500 });
  }
}
