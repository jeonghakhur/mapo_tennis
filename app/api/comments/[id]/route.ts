import { NextRequest, NextResponse } from 'next/server';
import { withPermission, UserWithLevel } from '@/lib/apiUtils';
import { updateComment, deleteComment } from '@/service/comment';
import type { CommentInput } from '@/model/comment';

// 코멘트 수정 핸들러
async function updateCommentHandler(
  req: NextRequest,
  user: UserWithLevel,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: commentId } = await context.params;
    const updateFields: Partial<CommentInput> = await req.json();

    if (!updateFields.content || !updateFields.content.trim()) {
      return NextResponse.json({ error: '코멘트 내용을 입력해주세요.' }, { status: 400 });
    }

    const comment = await updateComment(commentId, updateFields);
    return NextResponse.json({ success: true, comment });
  } catch (error) {
    console.error('코멘트 수정 오류:', error);
    return NextResponse.json({ error: '코멘트 수정 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 코멘트 삭제 핸들러
async function deleteCommentHandler(
  req: NextRequest,
  user: UserWithLevel,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const startTime = Date.now();
    const { id: commentId } = await context.params;

    console.log('코멘트 삭제 시작:', { commentId });

    await deleteComment(commentId);

    const endTime = Date.now();
    console.log('코멘트 삭제 완료:', { duration: endTime - startTime, commentId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('코멘트 삭제 오류:', error);
    return NextResponse.json({ error: '코멘트 삭제 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 코멘트 수정 API (PUT)
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  // 기본 사용자 권한 확인 (level 1 이상)
  return withPermission(req, 1, (req, user) => updateCommentHandler(req, user, context));
}

// 코멘트 삭제 API (DELETE)
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  // 기본 사용자 권한 확인 (level 1 이상)
  return withPermission(req, 1, (req, user) => deleteCommentHandler(req, user, context));
}
