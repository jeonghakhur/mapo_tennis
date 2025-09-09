import { NextRequest, NextResponse } from 'next/server';
import { checkPermission, createPermissionError } from '@/lib/apiUtils';
import { client } from '@/sanity/lib/client';

// GET: 경기 정보 조회
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const permissionResult = await checkPermission(1);
  if (!permissionResult.hasPermission) {
    return createPermissionError(permissionResult);
  }

  try {
    const { id } = await context.params;

    const query = `*[_type == "tournamentMatch" && _id == $id][0] {
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
    }`;

    const match = await client.fetch(query, { id });

    if (!match) {
      return NextResponse.json({ error: '경기를 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json(match);
  } catch (error) {
    console.error('경기 정보 조회 오류:', error);
    return NextResponse.json({ error: '경기 정보 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

// PUT: 경기 결과 업데이트
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const permissionResult = await checkPermission(4);
  if (!permissionResult.hasPermission) {
    return createPermissionError(permissionResult);
  }

  try {
    const { id } = await context.params;
    const body = await req.json();
    const {
      team1Score,
      team2Score,
      team1Sets,
      team2Sets,
      team1TotalSetsWon,
      team2TotalSetsWon,
      winner,
      status,
      court,
      scheduledTime,
    } = body;

    console.log('경기 결과 업데이트 요청:', { id, body });

    // 경기 정보 조회
    const matchQuery = `*[_type == "tournamentMatch" && _id == $id][0]`;
    const match = await client.fetch(matchQuery, { id });

    if (!match) {
      return NextResponse.json({ error: '경기를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 경기 정보 업데이트
    const updatedMatch = {
      _id: match._id,
      _type: match._type,
      _rev: match._rev,
      ...match,
      team1: {
        ...match.team1,
        score: team1Score, // 기존 호환성 유지
        sets: team1Sets || match.team1.sets,
        totalSetsWon:
          team1TotalSetsWon !== undefined ? team1TotalSetsWon : match.team1.totalSetsWon,
      },
      team2: {
        ...match.team2,
        score: team2Score, // 기존 호환성 유지
        sets: team2Sets || match.team2.sets,
        totalSetsWon:
          team2TotalSetsWon !== undefined ? team2TotalSetsWon : match.team2.totalSetsWon,
      },
      winner, // 프론트엔드에서 계산된 승자
      status: status || match.status,
      court: court || match.court,
      scheduledTime: scheduledTime || match.scheduledTime,
      updatedAt: new Date().toISOString(),
    };

    // Sanity에서 경기 정보 업데이트
    console.log('업데이트할 경기 정보:', updatedMatch);
    const result = await client.createOrReplace(updatedMatch);
    console.log('Sanity 업데이트 결과:', result);

    return NextResponse.json({
      success: true,
      data: updatedMatch,
    });
  } catch (error) {
    console.error('경기 결과 업데이트 오류:', error);
    return NextResponse.json(
      { error: '경기 결과 업데이트 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
