import { NextRequest, NextResponse } from 'next/server';
import { checkPermission, createPermissionError } from '@/lib/apiUtils';
import { client } from '@/sanity/lib/client';

// GET: 경기 정보 조회
export async function GET(req: NextRequest, context: Promise<{ params: { id: string } }>) {
  const permissionResult = await checkPermission(1);
  if (!permissionResult.hasPermission) {
    return createPermissionError(permissionResult);
  }

  try {
    const { params } = await context;
    const { id } = params;

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
export async function PUT(req: NextRequest, context: Promise<{ params: { id: string } }>) {
  const permissionResult = await checkPermission(4);
  if (!permissionResult.hasPermission) {
    return createPermissionError(permissionResult);
  }

  try {
    const { params } = await context;
    const { id } = params;
    const body = await req.json();
    const { team1Score, team2Score, status, court, scheduledTime } = body;

    console.log('경기 결과 업데이트 요청:', { id, body });

    // 경기 정보 조회
    const matchQuery = `*[_type == "tournamentMatch" && _id == $id][0]`;
    const match = await client.fetch(matchQuery, { id });

    if (!match) {
      return NextResponse.json({ error: '경기를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 승자 결정
    let winner = undefined;
    if (team1Score !== undefined && team2Score !== undefined) {
      if (team1Score > team2Score) {
        winner = match.team1.teamId;
      } else if (team2Score > team1Score) {
        winner = match.team2.teamId;
      }
    }

    // 경기 정보 업데이트
    const updatedMatch = {
      _id: match._id,
      _type: match._type,
      _rev: match._rev,
      ...match,
      team1: {
        ...match.team1,
        score: team1Score,
      },
      team2: {
        ...match.team2,
        score: team2Score,
      },
      winner,
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
