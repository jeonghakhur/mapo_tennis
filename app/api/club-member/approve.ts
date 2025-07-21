import { NextRequest, NextResponse } from 'next/server';
import { approveClubMemberByAdmin } from '@/service/clubMember';

export async function POST(req: NextRequest) {
  try {
    const { user, clubId, email, phone, gender, birth, score, userId } = await req.json();
    if (!user || !clubId) {
      return NextResponse.json({ error: 'user, clubId는 필수입니다.' }, { status: 400 });
    }
    const result = await approveClubMemberByAdmin({
      user,
      clubId,
      email,
      phone,
      gender,
      birth,
      score,
      userId,
    });
    return NextResponse.json({ clubMember: result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '서버 오류' },
      { status: 500 },
    );
  }
}
