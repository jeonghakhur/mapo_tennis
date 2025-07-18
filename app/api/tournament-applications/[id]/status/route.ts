import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { updateTournamentApplicationStatus } from '@/service/tournamentApplication';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인 필요' }, { status: 401 });
    }

    const { id } = await params;
    const { status } = await req.json();

    if (!status || !['pending', 'approved', 'rejected', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: '유효하지 않은 상태값' }, { status: 400 });
    }

    const result = await updateTournamentApplicationStatus(id, status);
    return NextResponse.json(result);
  } catch (error) {
    console.error('참가 신청 상태 업데이트 오류:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
