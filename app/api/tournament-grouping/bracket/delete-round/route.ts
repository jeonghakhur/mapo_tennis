import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/sanity/lib/client';

export async function DELETE(request: NextRequest) {
  try {
    const { tournamentId, division, round } = await request.json();

    if (!tournamentId || !division || !round) {
      return NextResponse.json(
        { error: '대회 ID, 부서, 라운드 정보가 필요합니다.' },
        { status: 400 },
      );
    }

    console.log(`라운드 삭제 요청: ${tournamentId}, ${division}, ${round}`);

    // 해당 라운드의 경기들만 필터링하여 업데이트
    const bracket = await client.fetch(
      `*[_type == "tournamentBracket" && tournamentId == $tournamentId && division == $division][0]`,
      { tournamentId, division },
    );

    if (!bracket) {
      return NextResponse.json(
        { error: '해당 대회와 부서의 본선 대진표를 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    // 해당 라운드의 경기들만 제거
    const updatedMatches = bracket.matches.filter(
      (match: { round: string }) => match.round !== round,
    );

    if (updatedMatches.length === bracket.matches.length) {
      return NextResponse.json(
        { error: `해당 라운드(${round})의 경기를 찾을 수 없습니다.` },
        { status: 404 },
      );
    }

    // 대진표 업데이트
    await client.patch(bracket._id).set({ matches: updatedMatches }).commit();

    console.log(
      `${round} 라운드 삭제 완료: ${bracket.matches.length - updatedMatches.length}개 경기 삭제`,
    );

    return NextResponse.json({
      success: true,
      message: `${round} 라운드가 성공적으로 삭제되었습니다.`,
      deletedMatchesCount: bracket.matches.length - updatedMatches.length,
    });
  } catch (error) {
    console.error('라운드 삭제 오류:', error);
    return NextResponse.json({ error: '라운드 삭제 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
