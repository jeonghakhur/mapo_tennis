import { NextRequest, NextResponse } from 'next/server';
import { withPermission } from '@/lib/apiUtils';
import { client } from '@/sanity/lib/client';

// 본선 대진표 삭제 핸들러
async function deleteBracketHandler(req: NextRequest) {
  try {
    const body = await req.json();
    const { tournamentId, division } = body;

    if (!tournamentId || !division) {
      return NextResponse.json({ error: '대회 ID와 부서는 필수입니다.' }, { status: 400 });
    }

    // 본선 대진표 정보 삭제
    const result = await client.delete({
      query: `*[_type == "tournamentBracket" && tournamentId == $tournamentId && division == $division]`,
      params: { tournamentId, division },
    });

    return NextResponse.json({
      success: true,
      message: '본선 대진표가 성공적으로 삭제되었습니다.',
      deletedCount: result.length,
    });
  } catch (error) {
    console.error('본선 대진표 삭제 오류:', error);
    return NextResponse.json(
      { error: '본선 대진표 삭제 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}

// DELETE: 본선 대진표 삭제
export async function DELETE(req: NextRequest) {
  return withPermission(req, 5, deleteBracketHandler);
}
