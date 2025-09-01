import { NextRequest, NextResponse } from 'next/server';
import {
  getPublishedPosts,
  getAllPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  getPostsByCategory,
} from '@/service/post';
import type { PostInput } from '@/model/post';

import { withPermission, PERMISSION_LEVELS } from '@/lib/apiUtils';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const all = searchParams.get('all');
  const category = searchParams.get('category');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '5');

  if (id) {
    const post = await getPost(id);
    if (!post) {
      return NextResponse.json({ error: '포스트를 찾을 수 없습니다.' }, { status: 404 });
    }
    return NextResponse.json({ post });
  }

  // 카테고리 필터가 있으면 해당 카테고리 포스트만
  if (category) {
    const posts = await getPostsByCategory(category);
    return NextResponse.json(posts);
  }

  // all 파라미터가 있으면 모든 포스트, 없으면 발행된 포스트만
  const posts = all === 'true' ? await getAllPosts() : await getPublishedPosts();

  return NextResponse.json({ posts });
}

export async function POST(req: NextRequest) {
  return withPermission(req, PERMISSION_LEVELS.POST_MANAGER, async (req) => {
    try {
      const data: PostInput = await req.json();

      // 필수 필드 검증
      if (!data.title || !data.title.trim()) {
        return NextResponse.json({ error: '제목은 필수 입력 사항입니다.' }, { status: 400 });
      }
      if (!data.author || !data.author._ref) {
        return NextResponse.json({ error: '작성자 정보가 올바르지 않습니다.' }, { status: 400 });
      }

      const result = await createPost({
        ...data,
        author: { _ref: typeof data.author === 'string' ? data.author : data.author._ref },
      });

      // 게시글 관련 알림 기능 제거 (새로운 알림 레벨 시스템에 따라)

      return NextResponse.json({ ok: true, id: result._id });
    } catch (e) {
      return NextResponse.json({ error: '생성 실패', detail: String(e) }, { status: 500 });
    }
  });
}

export async function PATCH(req: NextRequest) {
  return withPermission(req, PERMISSION_LEVELS.POST_MANAGER, async (req) => {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    // action 파라미터 제거
    if (!id) {
      return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 });
    }

    try {
      const updateFields: Partial<PostInput> = await req.json();
      const result = await updatePost(id, updateFields);

      // 게시글 관련 알림 기능 제거 (새로운 알림 레벨 시스템에 따라)

      return NextResponse.json({ ok: true, post: result });
    } catch (e) {
      return NextResponse.json({ error: '수정 실패', detail: String(e) }, { status: 500 });
    }
  });
}

export async function DELETE(req: NextRequest) {
  return withPermission(req, PERMISSION_LEVELS.POST_MANAGER, async (req) => {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 });
    }

    try {
      // 삭제 전에 포스트 정보 조회
      const existingPost = await getPost(id);
      if (!existingPost) {
        return NextResponse.json({ error: '포스트를 찾을 수 없습니다.' }, { status: 404 });
      }

      await deletePost(id);

      // 게시글 관련 알림 기능 제거 (새로운 알림 레벨 시스템에 따라)

      return NextResponse.json({ ok: true });
    } catch (e) {
      return NextResponse.json({ error: '삭제 실패', detail: String(e) }, { status: 500 });
    }
  });
}
