import { NextRequest, NextResponse } from 'next/server';
import { withPermission, UserWithLevel } from '@/lib/apiUtils';
import { getCommentsByPost, createComment } from '@/service/comment';
import type { CommentInput } from '@/model/comment';

// 코멘트 목록 조회 핸들러
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getCommentsHandler(req: NextRequest, _user: UserWithLevel) {
  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json({ error: '포스트 ID가 필요합니다.' }, { status: 400 });
    }

    const comments = await getCommentsByPost(postId);
    return NextResponse.json({ comments });
  } catch (error) {
    console.error('코멘트 조회 오류:', error);
    return NextResponse.json({ error: '코멘트 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 코멘트 생성 핸들러
async function createCommentHandler(req: NextRequest, user: UserWithLevel) {
  try {
    const data: CommentInput = await req.json();

    if (!data.content || !data.content.trim()) {
      return NextResponse.json({ error: '코멘트 내용을 입력해주세요.' }, { status: 400 });
    }

    if (!data.post) {
      return NextResponse.json({ error: '포스트 ID가 필요합니다.' }, { status: 400 });
    }

    const comment = await createComment({
      ...data,
      author: { _ref: user.id },
    });

    return NextResponse.json({ success: true, comment });
  } catch (error) {
    console.error('코멘트 생성 오류:', error);
    return NextResponse.json({ error: '코멘트 생성 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 코멘트 목록 조회 API (GET)
export async function GET(req: NextRequest) {
  // 기본 사용자 권한 확인 (level 1 이상)
  return withPermission(req, 1, getCommentsHandler);
}

// 코멘트 생성 API (POST)
export async function POST(req: NextRequest) {
  // 기본 사용자 권한 확인 (level 1 이상)
  return withPermission(req, 1, createCommentHandler);
}
