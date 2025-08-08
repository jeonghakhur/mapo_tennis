import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/sanity/lib/client';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> },
) {
  try {
    // Next.js 설정에 따라 params가 Promise인 경우 대응
    const { groupId } = await params;
    let groupIdParam = groupId;
    if (!groupIdParam) {
      const url = new URL(request.url);
      const segments = url.pathname.split('/');
      groupIdParam = segments[segments.length - 1] || '';
    }
    const body = await request.json();
    const { tournamentId, division } = body;

    if (!tournamentId || !division) {
      return NextResponse.json({ error: '대회 ID와 부서가 필요합니다.' }, { status: 400 });
    }
    if (!groupIdParam) {
      return NextResponse.json({ error: '그룹 식별자가 필요합니다.' }, { status: 400 });
    }

    // 해당 조 찾기
    const query = `*[_type == "tournamentGroup" && tournamentId == $tournamentId && division == $division && (_id == $groupIdParam || groupId == $groupIdParam)][0]`;
    const group = await client.fetch(query, { tournamentId, division, groupIdParam });

    if (!group) {
      return NextResponse.json({ error: '해당 조를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 조 삭제
    await client.delete(group._id);

    return NextResponse.json({ message: '조가 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('조 삭제 오류:', error);
    return NextResponse.json({ error: '조 삭제 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
