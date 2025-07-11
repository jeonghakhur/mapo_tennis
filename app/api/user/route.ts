import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, upsertUser } from '@/service/user';
import type { User } from '@/model/user';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');
  if (!email) {
    return NextResponse.json({ error: 'email is required' }, { status: 400 });
  }
  const user = await getUserByEmail(email);
  return NextResponse.json({ user: user || null });
}

export async function POST(req: NextRequest) {
  try {
    const { name, phone, gender, birth, score, email, address } = await req.json();
    if (!name || !phone || !gender || !birth || !score || !email) {
      return NextResponse.json({ error: '필수 정보 누락' }, { status: 400 });
    }
    const userData: Omit<User, '_id' | '_type'> = {
      name,
      phone,
      gender,
      birth,
      score: Number(score),
      email,
      level: 1,
      address,
    };
    const result = await upsertUser(userData);
    return NextResponse.json({ ok: true, id: result._id });
  } catch (e) {
    return NextResponse.json({ error: '서버 오류', detail: String(e) }, { status: 500 });
  }
}
