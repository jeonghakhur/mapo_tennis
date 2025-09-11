import { NextRequest, NextResponse } from 'next/server';
import {
  getTournamentBracket,
  updateBracketMatch,
  type BracketMatch,
  type SetScore,
} from '@/lib/tournamentBracketUtils';

interface MatchUpdateData {
  team1Score?: number;
  team2Score?: number;
  team1Name?: string;
  team2Name?: string;
  team1Sets?: SetScore[];
  team2Sets?: SetScore[];
  team1TotalSetsWon?: number;
  team2TotalSetsWon?: number;
  winner?: string;
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  court?: string;
}

// 본선 대진표 경기 결과 업데이트
export async function PUT(request: NextRequest, context: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await context.params;
  try {
    const matchKey = matchId; // 실제로는 matchKey를 받음
    const matchData: MatchUpdateData = await request.json();

    // URL에서 tournamentId와 division 추출 (실제 구현에서는 다른 방식 필요)
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');
    const division = searchParams.get('division');

    if (!tournamentId || !division) {
      return NextResponse.json({ error: '대회 ID와 부서가 필요합니다.' }, { status: 400 });
    }

    // 본선 대진표 조회
    const bracket = await getTournamentBracket(tournamentId, division);
    if (!bracket) {
      return NextResponse.json({ error: '본선 대진표를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 업데이트할 데이터 준비 - updateBracketMatch 함수가 기대하는 타입에 맞춤
    const updateData: Partial<BracketMatch> & {
      team1Name?: string;
      team2Name?: string;
    } = {};

    if (matchData.status) {
      updateData.status = matchData.status;
    }
    if (matchData.court !== undefined) {
      updateData.court = matchData.court;
    }
    if (matchData.winner !== undefined) {
      updateData.winner = matchData.winner;
    }

    // 팀명 업데이트 (updateBracketMatch 함수에서 처리)
    if (matchData.team1Name !== undefined) {
      updateData.team1Name = matchData.team1Name;
    }
    if (matchData.team2Name !== undefined) {
      updateData.team2Name = matchData.team2Name;
    }

    // 팀 정보 업데이트 (점수, 세트별 점수)
    const currentMatch = bracket.matches.find((m) => m._key === matchKey);
    if (currentMatch) {
      updateData.team1 = {
        teamId: currentMatch.team1.teamId,
        teamName: currentMatch.team1.teamName,
        score: currentMatch.team1.score,
        sets: currentMatch.team1.sets || [],
        totalSetsWon: currentMatch.team1.totalSetsWon || 0,
      };
      updateData.team2 = {
        teamId: currentMatch.team2.teamId,
        teamName: currentMatch.team2.teamName,
        score: currentMatch.team2.score,
        sets: currentMatch.team2.sets || [],
        totalSetsWon: currentMatch.team2.totalSetsWon || 0,
      };

      // 세트별 점수 업데이트
      if (matchData.team1Sets) {
        updateData.team1.sets = matchData.team1Sets;
      }
      if (matchData.team2Sets) {
        updateData.team2.sets = matchData.team2Sets;
      }

      // 총 세트 승수 업데이트
      if (matchData.team1TotalSetsWon !== undefined) {
        updateData.team1.totalSetsWon = matchData.team1TotalSetsWon;
      }
      if (matchData.team2TotalSetsWon !== undefined) {
        updateData.team2.totalSetsWon = matchData.team2TotalSetsWon;
      }

      // 기존 점수 업데이트 (하위 호환성)
      if (matchData.team1Score !== undefined) {
        updateData.team1.score = matchData.team1Score;
      }
      if (matchData.team2Score !== undefined) {
        updateData.team2.score = matchData.team2Score;
      }
    }

    // 경기 결과 업데이트
    const success = await updateBracketMatch(bracket._id, matchKey, updateData);

    if (!success) {
      console.error('경기 결과 업데이트 실패');
      return NextResponse.json({ error: '경기 결과 업데이트에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({
      message: '경기 결과가 성공적으로 업데이트되었습니다.',
    });
  } catch (error) {
    console.error('경기 결과 업데이트 오류:', error);
    return NextResponse.json({ error: '경기 결과 업데이트에 실패했습니다.' }, { status: 500 });
  }
}
