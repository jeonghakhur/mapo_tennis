import { NextRequest, NextResponse } from 'next/server';
import { withPermission, type UserWithLevel } from '@/lib/apiUtils';
import { client } from '@/sanity/lib/client';

// 경기 정보 조회 핸들러
async function getMatchesHandler(req: NextRequest, _user: UserWithLevel) {
  try {
    const { searchParams } = new URL(req.url);
    const tournamentId = searchParams.get('tournamentId');
    const division = searchParams.get('division');

    if (!tournamentId || !division) {
      return NextResponse.json({ error: '대회 ID와 부서는 필수입니다.' }, { status: 400 });
    }

    // 경기 정보 조회
    const query = `*[_type == "tournamentMatch" && tournamentId == $tournamentId && division == $division] {
      _id,
      tournamentId,
      division,
      groupId,
      round,
      matchNumber,
      team1,
      team2,
      winner,
      status,
      scheduledTime,
      court,
      createdAt,
      updatedAt
    } | order(matchNumber asc)`;

    const matches = await client.fetch(query, { tournamentId, division });

    return NextResponse.json(matches);
  } catch (error) {
    console.error('경기 정보 조회 오류:', error);
    return NextResponse.json({ error: '경기 정보 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

// GET: 경기 정보 조회
export async function GET(req: NextRequest) {
  return withPermission(req, 1, getMatchesHandler);
}
