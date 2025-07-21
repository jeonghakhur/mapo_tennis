import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, getUserById, upsertUser } from '@/service/user';
import { createNotification, createNotificationMessage } from '@/service/notification';
import { createNotificationLink } from '@/lib/notificationUtils';
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

    // 회원가입 알림 생성 (관리자만 받음)
    if (result._id) {
      const { title } = createNotificationMessage('CREATE', 'USER', name);

      // 상세한 회원가입 메시지 생성
      const detailedMessage = `새로운 회원이 가입했습니다.\n\n이름: ${name}\n이메일: ${email}\n연락처: ${phone}\n성별: ${gender === 'male' ? '남성' : '여성'}\n생년월일: ${birth}\n테니스 점수: ${score}점`;

      await createNotification({
        type: 'CREATE',
        entityType: 'USER',
        entityId: result._id,
        title,
        message: detailedMessage,
        link: createNotificationLink('USER', result._id),
      });
    }

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

    // 회원 정보 수정 알림 생성 (관리자만 받음)
    if (result._id) {
      const { title } = createNotificationMessage('UPDATE', 'USER', name);

      // 상세한 회원 수정 메시지 생성
      const detailedMessage = `회원 정보가 수정되었습니다.\n\n이름: ${name}\n이메일: ${email}\n연락처: ${phone}\n성별: ${gender === 'male' ? '남성' : '여성'}\n생년월일: ${birth}\n테니스 점수: ${score}점`;

      await createNotification({
        type: 'UPDATE',
        entityType: 'USER',
        entityId: result._id,
        title,
        message: detailedMessage,
        link: createNotificationLink('USER', result._id),
      });
    }

    return NextResponse.json({ ok: true, id: result._id });
  } catch (e) {
    return NextResponse.json({ error: '서버 오류', detail: String(e) }, { status: 500 });
  }
}
