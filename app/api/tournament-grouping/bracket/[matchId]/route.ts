import { NextRequest, NextResponse } from 'next/server';
import { getTournamentBracket, updateBracketMatch } from '@/lib/tournamentBracketUtils';
import type { BracketMatch } from '@/types/tournament';

interface MatchUpdateData {
  team1Score?: number;
  team2Score?: number;
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

    // 업데이트할 데이터 준비
    const updateData: Partial<BracketMatch> = {};

    if (matchData.status) {
      updateData.status = matchData.status;
    }
    if (matchData.court !== undefined) {
      updateData.court = matchData.court;
    }

    // 팀 점수 업데이트
    if (matchData.team1Score !== undefined || matchData.team2Score !== undefined) {
      const currentMatch = bracket.matches.find((m) => m._key === matchKey);
      if (currentMatch) {
        updateData.team1 = {
          teamId: currentMatch.team1.teamId,
          teamName: currentMatch.team1.teamName,
          score: matchData.team1Score,
        };
        updateData.team2 = {
          teamId: currentMatch.team2.teamId,
          teamName: currentMatch.team2.teamName,
          score: matchData.team2Score,
        };
      }
    }

    // 경기가 완료된 경우 승자 결정
    if (
      matchData.status === 'completed' &&
      matchData.team1Score !== undefined &&
      matchData.team2Score !== undefined
    ) {
      if (matchData.team1Score > matchData.team2Score) {
        updateData.winner = 'team1';
      } else if (matchData.team2Score > matchData.team1Score) {
        updateData.winner = 'team2';
      }
    }

    console.log('업데이트할 데이터:', { bracketId: bracket._id, matchKey, updateData });

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
