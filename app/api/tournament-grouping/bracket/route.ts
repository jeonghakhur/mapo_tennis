import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/sanity/lib/client';
import {
  getTournamentBracket,
  createTournamentBracket,
  getGroupStandings,
  selectQualifiedTeams,
  generateBracketMatches,
  isRoundCompleted,
  getWinningTeams,
  getNextRound,
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
    console.log('본선 대진표 생성 요청:', { tournamentId, division });

    if (!tournamentId || !division) {
      return NextResponse.json({ error: '대회 ID와 부서가 필요합니다.' }, { status: 400 });
    }

    // 조별 순위 조회
    const standings = await getGroupStandings(tournamentId, division);
    console.log('조별 순위 데이터:', standings);

    // 진출팀 선정
    const qualifiedTeams = selectQualifiedTeams(standings);
    console.log('진출팀 목록:', qualifiedTeams);

    if (qualifiedTeams.length < 2) {
      return NextResponse.json(
        { error: '진출팀이 부족합니다. 최소 2팀이 필요합니다.' },
        { status: 400 },
      );
    }

    // 본선 대진표 생성
    const matches = generateBracketMatches(qualifiedTeams);
    console.log('생성된 대진표 경기:', matches);

    // Sanity에 저장
    const bracket = await createTournamentBracket(tournamentId, division, matches);
    console.log('Sanity 저장 결과:', bracket);

    if (!bracket) {
      return NextResponse.json({ error: '본선 대진표 생성에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({
      message: '본선 대진표가 성공적으로 생성되었습니다.',
      matches: bracket.matches,
    });
  } catch (error) {
    console.error('본선 대진표 생성 오류:', error);
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    return NextResponse.json(
      {
        error: `본선 대진표 생성에 실패했습니다: ${errorMessage}`,
      },
      { status: 500 },
    );
  }
}

// 다음 라운드 대진표 생성
export async function PUT(request: NextRequest) {
  try {
    const { tournamentId, division, currentRound } = await request.json();
    console.log('다음 라운드 대진표 생성 요청:', { tournamentId, division, currentRound });

    if (!tournamentId || !division || !currentRound) {
      return NextResponse.json(
        { error: '대회 ID, 부서, 현재 라운드가 필요합니다.' },
        { status: 400 },
      );
    }

    // 현재 대진표 조회
    const bracket = await getTournamentBracket(tournamentId, division);
    if (!bracket) {
      return NextResponse.json({ error: '현재 대진표를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 현재 라운드가 완료되었는지 확인
    if (!isRoundCompleted(bracket.matches, currentRound)) {
      return NextResponse.json(
        { error: '현재 라운드가 아직 완료되지 않았습니다.' },
        { status: 400 },
      );
    }

    // 다음 라운드 확인
    const nextRound = getNextRound(currentRound);
    if (!nextRound) {
      return NextResponse.json({ error: '더 이상 진행할 라운드가 없습니다.' }, { status: 400 });
    }

    // 승리한 팀들 가져오기
    const winningTeams = getWinningTeams(bracket.matches, currentRound);
    console.log('승리한 팀들:', winningTeams);

    if (winningTeams.length < 2) {
      return NextResponse.json(
        { error: '진출팀이 부족합니다. 최소 2팀이 필요합니다.' },
        { status: 400 },
      );
    }

    // 다음 라운드 대진표 생성
    const nextRoundMatches = generateBracketMatches(winningTeams);
    console.log('다음 라운드 대진표:', nextRoundMatches);

    // 기존 대진표에 다음 라운드 경기 추가
    const updatedMatches = [...bracket.matches, ...nextRoundMatches];

    // 대진표 업데이트
    const updatedBracket = await client
      .patch(bracket._id)
      .set({
        matches: updatedMatches,
        updatedAt: new Date().toISOString(),
      })
      .commit();

    return NextResponse.json({
      message: `${nextRound} 대진표가 성공적으로 생성되었습니다.`,
      matches: updatedMatches,
    });
  } catch (error) {
    console.error('다음 라운드 대진표 생성 오류:', error);
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    return NextResponse.json(
      {
        error: `다음 라운드 대진표 생성에 실패했습니다: ${errorMessage}`,
      },
      { status: 500 },
    );
  }
}
