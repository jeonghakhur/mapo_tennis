import { NextRequest, NextResponse } from 'next/server';
import { withPermission, authenticateUser } from '@/lib/apiUtils';
import { createQuestion, getMyQuestions } from '@/service/question';

// 본인 문의 목록 조회
export async function GET(req: NextRequest) {
  return withPermission(req, 1, async () => {
    const { user: fullUser } = await authenticateUser();
    if (!fullUser?._id) {
      return NextResponse.json({ error: '유저 정보 없음' }, { status: 400 });
    }
    const questions = await getMyQuestions(fullUser._id);
    return NextResponse.json({ questions });
  });
}

// 문의 작성
export async function POST(req: NextRequest) {
  return withPermission(req, 1, async () => {
    const { user: fullUser } = await authenticateUser();
    if (!fullUser?._id) {
      return NextResponse.json({ error: '유저 정보 없음' }, { status: 400 });
    }
    const body = await req.json();
    const { title, content, attachments } = body;
    if (!title || !content) {
      return NextResponse.json({ error: '제목과 내용을 입력해 주세요.' }, { status: 400 });
    }
    const question = await createQuestion({
      title,
      content,
      attachments,
      author: { _ref: fullUser._id },
    });
    return NextResponse.json({ question });
  });
}
