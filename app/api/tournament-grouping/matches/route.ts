import { NextRequest, NextResponse } from 'next/server';
import { withPermission } from '@/lib/apiUtils';
import { client } from '@/sanity/lib/client';

// 경기 정보 조회 핸들러
async function getMatchesHandler(req: NextRequest) {
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

// 예선 경기 삭제 핸들러
async function deleteMatchesHandler(req: NextRequest) {
  try {
    const body = await req.json();
    const { tournamentId, division } = body;

    if (!tournamentId || !division) {
      return NextResponse.json({ error: '대회 ID와 부서는 필수입니다.' }, { status: 400 });
    }

    console.log('예선 경기 삭제 요청:', { tournamentId, division });

    // 해당 대회와 부서의 모든 경기 삭제
    const deleteQuery = `*[_type == "tournamentMatch" && tournamentId == $tournamentId && division == $division]`;
    const matchesToDelete = await client.fetch(deleteQuery, { tournamentId, division });

    if (matchesToDelete.length === 0) {
      return NextResponse.json({ message: '삭제할 경기가 없습니다.' });
    }

    // 각 경기를 삭제
    const deletePromises = matchesToDelete.map((match: { _id: string }) =>
      client.delete(match._id),
    );
    await Promise.all(deletePromises);

    console.log(`${matchesToDelete.length}개의 예선 경기가 삭제되었습니다.`);

    return NextResponse.json({
      success: true,
      message: `${matchesToDelete.length}개의 예선 경기가 삭제되었습니다.`,
      deletedCount: matchesToDelete.length,
    });
  } catch (error) {
    console.error('예선 경기 삭제 오류:', error);
    return NextResponse.json({ error: '예선 경기 삭제 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

// GET: 경기 정보 조회
export async function GET(req: NextRequest) {
  return withPermission(req, 1, getMatchesHandler);
}

// DELETE: 예선 경기 삭제
export async function DELETE(req: NextRequest) {
  return withPermission(req, 5, deleteMatchesHandler);
}
