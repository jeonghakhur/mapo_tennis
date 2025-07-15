import { NextRequest, NextResponse } from 'next/server';
import {
  getClubMembers,
  getClubMember,
  createClubMember,
  updateClubMember,
  deleteClubMember,
  deleteAllClubMembers,
} from '@/service/clubMember';
import type { ClubMemberInput } from '@/model/clubMember';
import {
  createNotification,
  trackChanges,
  createNotificationMessage,
} from '@/service/notification';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (id) {
    const member = await getClubMember(id);
    if (!member) {
      return NextResponse.json({ error: '클럽회원을 찾을 수 없습니다.' }, { status: 404 });
    }
    return NextResponse.json({ member });
  }
  const members = await getClubMembers();
  return NextResponse.json({ members });
}

export async function POST(req: NextRequest) {
  try {
    const data: ClubMemberInput = await req.json();
    const result = await createClubMember(data);

    // 알림 생성
    const { title, message } = createNotificationMessage('CREATE', 'CLUB_MEMBER', data.user);

    await createNotification({
      type: 'CREATE',
      entityType: 'CLUB_MEMBER',
      entityId: result._id,
      title,
      message,
    });

    return NextResponse.json({ ok: true, id: result._id });
  } catch (e) {
    return NextResponse.json({ error: '생성 실패', detail: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 });
  }
  try {
    const updateFields: Partial<ClubMemberInput> = await req.json();

    // 기존 데이터 조회
    const existingMember = await getClubMember(id);
    if (!existingMember) {
      return NextResponse.json({ error: '클럽회원을 찾을 수 없습니다.' }, { status: 404 });
    }

    const result = await updateClubMember(id, updateFields);
    console.log(result);

    // 변경사항 추적
    const changes = trackChanges(
      existingMember as unknown as Record<string, unknown>,
      result as unknown as Record<string, unknown>,
    );

    if (changes.length > 0) {
      // 알림 생성
      const { title, message } = createNotificationMessage(
        'UPDATE',
        'CLUB_MEMBER',
        result?.user || '',
      );

      await createNotification({
        type: 'UPDATE',
        entityType: 'CLUB_MEMBER',
        entityId: id,
        title,
        message,
        changes,
      });
    }

    return NextResponse.json({ ok: true, member: result });
  } catch (e) {
    return NextResponse.json({ error: '수정 실패', detail: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  try {
    if (!id) {
      // 전체 삭제 (배치)
      const result = await deleteAllClubMembers();

      // 전체 삭제 알림 생성
      const { title, message } = createNotificationMessage('DELETE', 'CLUB_MEMBER', '모든 회원');

      await createNotification({
        type: 'DELETE',
        entityType: 'CLUB_MEMBER',
        entityId: 'all',
        title,
        message,
      });

      return NextResponse.json({ ok: true, deleted: result });
    }

    // 개별 삭제 전에 회원 정보 조회
    const existingMember = await getClubMember(id);
    if (!existingMember) {
      return NextResponse.json({ error: '클럽회원을 찾을 수 없습니다.' }, { status: 404 });
    }

    await deleteClubMember(id);

    // 삭제 알림 생성
    const { title, message } = createNotificationMessage(
      'DELETE',
      'CLUB_MEMBER',
      existingMember.user,
    );

    await createNotification({
      type: 'DELETE',
      entityType: 'CLUB_MEMBER',
      entityId: id,
      title,
      message,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: '삭제 실패', detail: String(e) }, { status: 500 });
  }
}
