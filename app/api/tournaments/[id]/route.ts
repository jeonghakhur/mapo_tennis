import { NextRequest, NextResponse } from 'next/server';
import { getTournament, updateTournament, deleteTournament } from '@/service/tournament';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { parseTournamentFormData } from '@/lib/tournamentUtils';

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
    await deleteTournament(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('대회 삭제 실패:', error);
    return NextResponse.json({ error: '대회를 삭제할 수 없습니다.' }, { status: 500 });
  }
}
