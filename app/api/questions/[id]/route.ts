import { NextRequest, NextResponse } from 'next/server';
import { withPermission, authenticateUser, checkOwnershipOrAdmin } from '@/lib/apiUtils';
import { getQuestionById, answerQuestion } from '@/service/question';

// 문의 상세 조회 (본인/관리자만)
export async function GET(req: NextRequest, context: { params: { id: string } }) {
  return withPermission(req, 2, async () => {
    const { user: fullUser } = await authenticateUser();
    if (!fullUser?._id) {
      return NextResponse.json({ error: '유저 정보 없음' }, { status: 400 });
    }
    const question = await getQuestionById(context.params.id);
    if (!question) {
      return NextResponse.json({ error: '문의가 존재하지 않습니다.' }, { status: 404 });
    }
    // 본인 또는 관리자만 접근 가능
    const permission = checkOwnershipOrAdmin(
      fullUser,
      typeof question.author === 'string' ? question.author : question.author._id,
    );
    if (permission.error) return permission.error;
    return NextResponse.json({ question });
  });
}

// 답변 등록/수정 (관리자만)
export async function PUT(req: NextRequest, context: { params: { id: string } }) {
  return withPermission(req, 5, async () => {
    const { user: fullUser } = await authenticateUser();
    if (!fullUser?._id) {
      return NextResponse.json({ error: '유저 정보 없음' }, { status: 400 });
    }
    const body = await req.json();
    const { answer } = body;
    if (!answer) {
      return NextResponse.json({ error: '답변 내용을 입력해 주세요.' }, { status: 400 });
    }
    const question = await answerQuestion({
      questionId: context.params.id,
      answer,
      answeredById: fullUser._id,
    });
    return NextResponse.json({ question });
  });
}
