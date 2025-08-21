import { NextRequest, NextResponse } from 'next/server';
import {
  getTournamentBracket,
  createTournamentBracket,
  getGroupStandings,
  selectQualifiedTeams,
  generateBracketMatches,
} from '@/lib/tournamentBracketUtils';

// 본선 대진표 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');
    const division = searchParams.get('division');

    if (!tournamentId || !division) {
      return NextResponse.json({ error: '대회 ID와 부서가 필요합니다.' }, { status: 400 });
    }

    const bracket = await getTournamentBracket(tournamentId, division);

    if (!bracket) {
      return NextResponse.json({ matches: [] });
    }

    return NextResponse.json({ matches: bracket.matches });
  } catch (error) {
    console.error('본선 대진표 조회 오류:', error);
    return NextResponse.json({ error: '본선 대진표 조회에 실패했습니다.' }, { status: 500 });
  }
}

// 본선 대진표 생성
export async function POST(request: NextRequest) {
  try {
    const { tournamentId, division } = await request.json();

    if (!tournamentId || !division) {
      return NextResponse.json({ error: '대회 ID와 부서가 필요합니다.' }, { status: 400 });
    }

    // 조별 순위 조회
    const standings = await getGroupStandings(tournamentId, division);

    // 진출팀 선정
    const qualifiedTeams = selectQualifiedTeams(standings);

    if (qualifiedTeams.length < 2) {
      return NextResponse.json(
        { error: '진출팀이 부족합니다. 최소 2팀이 필요합니다.' },
        { status: 400 },
      );
    }

    // 본선 대진표 생성
    const matches = generateBracketMatches(qualifiedTeams);

    // Sanity에 저장
    const bracket = await createTournamentBracket(tournamentId, division, matches);

    if (!bracket) {
      return NextResponse.json({ error: '본선 대진표 생성에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({
      message: '본선 대진표가 성공적으로 생성되었습니다.',
      matches: bracket.matches,
    });
  } catch (error) {
    console.error('본선 대진표 생성 오류:', error);
    return NextResponse.json({ error: '본선 대진표 생성에 실패했습니다.' }, { status: 500 });
  }
}
