import { NextRequest, NextResponse } from 'next/server';
import { withPermission } from '@/lib/apiUtils';
import { client } from '@/sanity/lib/client';

// 조편성 및 경기 전체 삭제 핸들러
async function deleteAllHandler(req: NextRequest) {
  try {
    const body = await req.json();
    const { tournamentId, division } = body;

    if (!tournamentId || !division) {
      return NextResponse.json({ error: '대회 ID와 부서는 필수입니다.' }, { status: 400 });
    }

    // 조편성 정보 삭제
    await client.delete({
      query: `*[_type == "tournamentGroup" && tournamentId == $tournamentId && division == $division]`,
      params: { tournamentId, division },
    });

    // 경기 정보 삭제
    await client.delete({
      query: `*[_type == "tournamentMatch" && tournamentId == $tournamentId && division == $division]`,
      params: { tournamentId, division },
    });

    return NextResponse.json({
      success: true,
      message: '조편성과 경기 정보가 모두 삭제되었습니다.',
    });
  } catch (error) {
    console.error('조편성 및 경기 삭제 오류:', error);
    return NextResponse.json(
      { error: '조편성 및 경기 삭제 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}

// DELETE: 조편성 및 경기 전체 삭제
export async function DELETE(req: NextRequest) {
  return withPermission(req, 5, deleteAllHandler);
}
