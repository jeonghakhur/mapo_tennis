import { NextRequest, NextResponse } from 'next/server';
import { withPermission, type UserWithLevel } from '@/lib/apiUtils';
import { calculateGroupStandings } from '@/service/tournamentGrouping';

// 조별 순위 계산 핸들러
async function getStandingsHandler(req: NextRequest, _user: UserWithLevel) {
  try {
    const { searchParams } = new URL(req.url);
    const tournamentId = searchParams.get('tournamentId');
    const division = searchParams.get('division');

    if (!tournamentId || !division) {
      return NextResponse.json({ error: '대회 ID와 부서는 필수입니다.' }, { status: 400 });
    }

    const standings = await calculateGroupStandings(tournamentId, division);

    console.log('API 응답 - 순위 데이터:', standings);

    return NextResponse.json({
      success: true,
      data: standings,
    });
  } catch (error) {
    console.error('순위 계산 오류:', error);
    return NextResponse.json({ error: '순위 계산 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

// GET: 조별 순위 계산
export async function GET(req: NextRequest) {
  return withPermission(req, 1, getStandingsHandler);
}
