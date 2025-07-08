import { NextRequest, NextResponse } from 'next/server';
import { upsertUser } from '../../../../service/user';

export async function POST(req: NextRequest) {
  try {
    const { name, phone, gender, birth, score, email } = await req.json();
    if (!name || !phone || !gender || !birth || !score || !email) {
      return NextResponse.json({ error: '필수 정보 누락' }, { status: 400 });
    }
    const result = await upsertUser({ name, phone, gender, birth, score, email });
    return NextResponse.json({ ok: true, id: result._id });
  } catch (e) {
    return NextResponse.json({ error: '서버 오류', detail: String(e) }, { status: 500 });
  }
}
