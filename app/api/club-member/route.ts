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
    const result = await updateClubMember(id, updateFields);
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
      return NextResponse.json({ ok: true, deleted: result });
    }
    await deleteClubMember(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: '삭제 실패', detail: String(e) }, { status: 500 });
  }
}
