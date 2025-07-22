import { NextRequest, NextResponse } from 'next/server';
import { approveClubMemberByAdmin } from '@/service/clubMember';
import { withPermission } from '@/lib/apiUtils';

async function approveHandler(req: NextRequest) {
  try {
    const { user, clubId, email, phone, gender, birth, score } = await req.json();
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
    });
    return NextResponse.json({ clubMember: result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '서버 오류' },
      { status: 500 },
    );
  }
}

export const POST = (req: NextRequest) => withPermission(req, 5, approveHandler);
