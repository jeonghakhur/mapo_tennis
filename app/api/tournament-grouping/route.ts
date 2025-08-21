import { NextRequest, NextResponse } from 'next/server';
import { withPermission, type UserWithLevel } from '@/lib/apiUtils';
import {
  createTournamentGroups,
  createGroupMatches,
  calculateGroupStandings,
} from '@/service/tournamentGrouping';
import type { GroupingOptions } from '@/types/tournament';

// 조편성 생성 핸들러
async function createGroupingHandler(req: NextRequest, _user: UserWithLevel) {
  try {
    const body = await req.json();
    const { tournamentId, division, options } = body;

    if (!tournamentId || !division) {
      return NextResponse.json({ error: '대회 ID와 부서는 필수입니다.' }, { status: 400 });
    }

    const groupingOptions: GroupingOptions = {
      method: options?.method || 'random',
      teamsPerGroup: options?.teamsPerGroup || 3,
      seedCriteria: options?.seedCriteria || 'registration_order',
      avoidSameClub: options?.avoidSameClub || false,
    };

    const result = await createTournamentGroups(tournamentId, division, groupingOptions);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('조편성 생성 오류:', error);
    return NextResponse.json({ error: '조편성 생성 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 예선 경기 생성 핸들러
async function createMatchesHandler(req: NextRequest, _user: UserWithLevel) {
  try {
    const body = await req.json();
    const { tournamentId, division } = body;

    if (!tournamentId || !division) {
      return NextResponse.json({ error: '대회 ID와 부서는 필수입니다.' }, { status: 400 });
    }

    const matches = await createGroupMatches(tournamentId, division);

    return NextResponse.json({
      success: true,
      data: matches,
    });
  } catch (error) {
    console.error('경기 생성 오류:', error);
    return NextResponse.json({ error: '경기 생성 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 조별 순위 계산 핸들러
async function calculateStandingsHandler(req: NextRequest, _user: UserWithLevel) {
  try {
    const { searchParams } = new URL(req.url);
    const tournamentId = searchParams.get('tournamentId');
    const division = searchParams.get('division');

    if (!tournamentId || !division) {
      return NextResponse.json({ error: '대회 ID와 부서는 필수입니다.' }, { status: 400 });
    }

    const standings = await calculateGroupStandings(tournamentId, division);

    return NextResponse.json({
      success: true,
      data: standings,
    });
  } catch (error) {
    console.error('순위 계산 오류:', error);
    return NextResponse.json({ error: '순위 계산 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

// POST: 조편성 생성
export async function POST(req: NextRequest) {
  return withPermission(req, 5, createGroupingHandler);
}

// PUT: 예선 경기 생성
export async function PUT(req: NextRequest) {
  return withPermission(req, 5, createMatchesHandler);
}

// GET: 조별 순위 계산
export async function GET(req: NextRequest) {
  return withPermission(req, 1, calculateStandingsHandler);
}
