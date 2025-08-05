import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, getUserById, upsertUser } from '@/service/user';
import {
  createNotification,
  createNotificationMessage,
  createNotificationStatuses,
} from '@/service/notification';
import { createNotificationLink } from '@/lib/notificationUtils';
import { getClubs } from '@/service/club';
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
    const body = await req.json();
    const { name, phone, gender, birth, score, email, address, clubs } = body;

    if (!name || !phone || !gender || !birth || !score || !email) {
      return NextResponse.json({ error: '필수 정보 누락' }, { status: 400 });
    }

    const userData: Omit<User, '_id' | '_type'> & { clubs?: string[] } = {
      name,
      phone,
      gender,
      birth,
      score: Number(score),
      email,
      level: 1,
      address,
      clubs: clubs ? clubs.map((clubId: string) => clubId) : [],
    };

    const result = await upsertUser(userData);

    // 회원가입 알림 생성 (관리자만 받음)
    if (result._id) {
      // 클럽 정보 가져오기
      let clubInfo = '';
      if (clubs && clubs.length > 0) {
        try {
          const allClubs = await getClubs();
          const selectedClubs = allClubs.filter((club) => clubs.includes(club._id!));
          if (selectedClubs.length > 0) {
            clubInfo = ` (${selectedClubs.map((club) => club.name).join(', ')})`;
          }
        } catch (error) {
          console.error('클럽 정보 조회 실패:', error);
        }
      }

      const { title } = createNotificationMessage('CREATE', 'USER', `${name}${clubInfo}`);

      // 상세한 회원가입 메시지 생성
      const detailedMessage = `새로운 회원이 가입했습니다.\n\n이름: ${name}\n이메일: ${email}\n연락처: ${phone}\n성별: ${gender}\n생년월일: ${birth}\n테니스 점수: ${score}점${clubInfo}`;

      // 알림 생성
      const notification = await createNotification({
        type: 'CREATE',
        entityType: 'USER',
        entityId: result._id, // 실제 사용자 ID 사용
        title,
        message: detailedMessage,
        link: createNotificationLink('USER', result._id),
        requiredLevel: 5, // 레벨 5 (어드민)만 알림 수신
      });

      // 새로운 notificationStatus 구조에 맞게 알림 상태 생성
      await createNotificationStatuses(notification._id, undefined, 5);
    }

    return NextResponse.json({ ok: true, id: result._id });
  } catch (e) {
    console.error('회원가입 오류:', e);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { name, phone, gender, birth, score, email, address, clubs, isApprovedUser, level } =
      await req.json();
    if (!name || !phone || !gender || !birth || !score || !email) {
      return NextResponse.json({ error: '필수 정보 누락' }, { status: 400 });
    }

    // 기존 사용자 정보 조회
    const existingUser = await getUserByEmail(email);
    if (!existingUser) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다' }, { status: 404 });
    }

    const userData: Omit<User, '_id' | '_type'> & { clubs?: string[] } = {
      name,
      phone,
      gender,
      birth,
      score: Number(score),
      email,
      level: level !== undefined ? Number(level) : existingUser.level || 1, // level 필드 처리
      address,
      clubs: clubs || [],
      isApprovedUser:
        isApprovedUser !== undefined ? isApprovedUser : (existingUser.isApprovedUser ?? false),
    };

    const result = await upsertUser(userData);

    // 회원 정보 수정 알림 생성 (관리자만 받음)
    if (result._id) {
      // 클럽 정보 가져오기
      let clubInfo = '';
      try {
        const allClubs = await getClubs();
        const userClubs = allClubs.filter((club) => (clubs || []).includes(club._id!));
        if (userClubs.length > 0) {
          clubInfo = ` (${userClubs.map((club) => club.name).join(', ')})`;
        }
      } catch (error) {
        console.error('클럽 정보 조회 실패:', error);
      }

      const { title } = createNotificationMessage('UPDATE', 'USER', `${name}${clubInfo}`);

      // 변경된 내용만 추출하여 메시지 생성
      const changes = [];

      if (existingUser.name !== name) {
        changes.push(`이름: ${existingUser.name} → ${name}`);
      }
      if (existingUser.phone !== phone) {
        changes.push(`연락처: ${existingUser.phone} → ${phone}`);
      }
      if (existingUser.gender !== gender) {
        changes.push(`성별: ${existingUser.gender} → ${gender}`);
      }
      if (existingUser.birth !== birth) {
        changes.push(`생년월일: ${existingUser.birth} → ${birth}`);
      }
      if (existingUser.score !== Number(score)) {
        changes.push(`테니스 점수: ${existingUser.score}점 → ${score}점`);
      }
      if (existingUser.address !== address) {
        if (existingUser.address && address) {
          changes.push(`주소: ${existingUser.address} → ${address}`);
        } else if (!existingUser.address && address) {
          changes.push(`주소: 추가됨 (${address})`);
        } else if (existingUser.address && !address) {
          changes.push(`주소: 삭제됨`);
        }
      }
      if (level !== undefined && existingUser.level !== Number(level)) {
        const levelNames = {
          1: '일반회원',
          2: '클럽관리자',
          3: '대회관리자',
          4: '경기관리자',
          5: '시스템관리자',
        };
        const oldLevelName =
          levelNames[existingUser.level as keyof typeof levelNames] || `레벨 ${existingUser.level}`;
        const newLevelName =
          levelNames[Number(level) as keyof typeof levelNames] || `레벨 ${level}`;
        changes.push(`회원 레벨: ${oldLevelName} → ${newLevelName}`);
      }

      // 클럽 정보 변경 확인
      const existingClubIds =
        (existingUser as User & { clubs?: { _ref: string; _type: 'reference' }[] }).clubs?.map(
          (club) => club._ref,
        ) || [];
      const newClubIds = clubs || [];

      if (JSON.stringify(existingClubIds.sort()) !== JSON.stringify(newClubIds.sort())) {
        try {
          const allClubs = await getClubs();
          const existingClubs = allClubs.filter((club) => existingClubIds.includes(club._id!));
          const newClubs = allClubs.filter((club) => newClubIds.includes(club._id!));

          const existingClubNames = existingClubs.map((club) => club.name).join(', ') || '없음';
          const newClubNames = newClubs.map((club) => club.name).join(', ') || '없음';

          changes.push(`가입 클럽: ${existingClubNames} → ${newClubNames}`);
        } catch (error) {
          console.error('클럽 정보 조회 실패:', error);
          changes.push(`가입 클럽: 변경됨 (상세 정보 조회 실패)`);
        }
      }

      // 변경된 내용이 있을 때만 알림 생성
      if (changes.length > 0) {
        const detailedMessage = `${name}${clubInfo} 회원 정보가 수정되었습니다.\n\n변경된 내용:\n${changes.join('\n')}`;

        // 알림 생성
        const notification = await createNotification({
          type: 'UPDATE',
          entityType: 'USER',
          entityId: result._id,
          title,
          message: detailedMessage,
          link: createNotificationLink('USER', result._id),
          requiredLevel: 5, // 레벨 5 (어드민)만 알림 수신
        });

        // 새로운 notificationStatus 구조에 맞게 알림 상태 생성
        await createNotificationStatuses(notification._id, undefined, 5);
      }
    }

    return NextResponse.json({ ok: true, id: result._id });
  } catch (e) {
    return NextResponse.json({ error: '서버 오류', detail: String(e) }, { status: 500 });
  }
}
