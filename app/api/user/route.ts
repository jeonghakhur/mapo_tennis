import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, getUserById, upsertUser } from '@/service/user';
import type { User } from '@/model/user';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');
  const id = searchParams.get('id');

  if (!email && !id) {
    return NextResponse.json({ error: 'email or id is required' }, { status: 400 });
  }

  let user = null;
  if (email) {
    user = await getUserByEmail(email);
  } else if (id) {
    user = await getUserById(id);
  }

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

export async function PUT(req: NextRequest) {
  try {
    const { name, phone, gender, birth, score, email, address } = await req.json();
    if (!name || !phone || !gender || !birth || !score || !email) {
      return NextResponse.json({ error: '필수 정보 누락' }, { status: 400 });
    }

    // 기존 사용자 정보 조회
    const existingUser = await getUserByEmail(email);
    if (!existingUser) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다' }, { status: 404 });
    }

    const userData: Omit<User, '_id' | '_type'> = {
      name,
      phone,
      gender,
      birth,
      score: Number(score),
      email,
      level: existingUser.level || 1, // 기존 레벨 유지
      address,
    };

    const result = await upsertUser(userData);
    return NextResponse.json({ ok: true, id: result._id });
  } catch (e) {
    return NextResponse.json({ error: '서버 오류', detail: String(e) }, { status: 500 });
  }
}
