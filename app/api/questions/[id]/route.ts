import { NextRequest, NextResponse } from 'next/server';
import { withPermission, authenticateUser } from '@/lib/apiUtils';
import { getQuestionById, answerQuestion, deleteQuestion } from '@/service/question';

// 문의 상세 조회 (본인/레벨 4 이상만)
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withPermission(req, 1, async () => {
    try {
      const { id } = await context.params;
      const { user: fullUser } = await authenticateUser();
      if (!fullUser?._id) {
        return NextResponse.json({ error: '유저 정보 없음' }, { status: 400 });
      }
      const question = await getQuestionById(id);
      if (!question) {
        return NextResponse.json({ error: '문의가 존재하지 않습니다.' }, { status: 404 });
      }
      // 본인 또는 레벨 4 이상만 접근 가능
      const isManager = fullUser.level && fullUser.level >= 4;
      const isOwner = typeof question.author === 'object' && question.author._id === fullUser._id;
      if (!isManager && !isOwner) {
        return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
      }
      return NextResponse.json({ question });
    } catch (error) {
      console.error('문의 상세 조회 오류:', error);
      return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
    }
  });
}

// 답변 등록/수정 (레벨 4 이상만)
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withPermission(req, 1, async () => {
    try {
      const { id } = await context.params;
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
        questionId: id,
        answer,
        answeredById: fullUser._id,
      });
      return NextResponse.json({ question });
    } catch (error) {
      console.error('문의 답변 등록/수정 오류:', error);
      return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
    }
  });
}

// 문의 삭제 (작성자 또는 레벨 4 이상)
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withPermission(req, 1, async () => {
    try {
      const { id } = await context.params;
      const { user: fullUser } = await authenticateUser();
      if (!fullUser?._id) {
        return NextResponse.json({ error: '유저 정보 없음' }, { status: 400 });
      }
      const question = await getQuestionById(id);
      if (!question) {
        return NextResponse.json({ error: '문의가 존재하지 않습니다.' }, { status: 404 });
      }
      const isManager = fullUser.level && fullUser.level >= 4;
      const isOwner =
        (typeof question.author === 'object' && question.author._id === fullUser._id) ||
        (typeof question.author === 'string' && question.author === fullUser._id);
      if (!isManager && !isOwner) {
        return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
      }
      await deleteQuestion(id);
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('문의 삭제 오류:', error);
      return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
    }
  });
}
