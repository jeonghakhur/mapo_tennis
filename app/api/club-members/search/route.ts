import { NextRequest, NextResponse } from 'next/server';
import { searchClubMemberByName } from '@/service/tournamentApplication';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');
    const clubId = searchParams.get('clubId');

    if (!name || !clubId) {
      return NextResponse.json({ error: '이름과 클럽 ID가 필요합니다' }, { status: 400 });
    }

    const member = await searchClubMemberByName(name, clubId);

    if (!member) {
      return NextResponse.json({ found: false });
    }

    return NextResponse.json({ found: true, member });
  } catch (error) {
    console.error('클럽 회원 검색 오류:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
