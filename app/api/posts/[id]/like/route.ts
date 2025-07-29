import { NextRequest, NextResponse } from 'next/server';
import { withPermission, UserWithLevel } from '@/lib/apiUtils';
import { client } from '@/sanity/lib/client';
import type { LikeToggleResponse } from '@/model/post';

// 좋아요 토글 핸들러
async function likeToggleHandler(req: NextRequest, user: UserWithLevel) {
  try {
    // URL에서 포스트 ID 추출
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    const postId = pathSegments[pathSegments.length - 2]; // /api/posts/[id]/like에서 [id] 추출

    console.log('URL:', req.url);
    console.log('Path segments:', pathSegments);
    console.log('Extracted postId:', postId);

    if (!postId) {
      return NextResponse.json({ error: '포스트 ID가 필요합니다.' }, { status: 400 });
    }

    // 현재 포스트 정보 조회
    const post = await client.getDocument(postId);
    if (!post) {
      return NextResponse.json({ error: '포스트를 찾을 수 없습니다.' }, { status: 404 });
    }

    const currentLikedBy = post.likedBy || [];
    const userId = user.id as string;
    const isCurrentlyLiked = currentLikedBy.includes(userId);

    let newLikedBy: string[];
    let newLikeCount: number;

    if (isCurrentlyLiked) {
      // 좋아요 취소
      newLikedBy = currentLikedBy.filter((id: string) => id !== userId);
      newLikeCount = Math.max(0, (post.likeCount || 0) - 1);
    } else {
      // 좋아요 추가
      newLikedBy = [...currentLikedBy, userId];
      newLikeCount = (post.likeCount || 0) + 1;
    }

    // 포스트 업데이트
    await client
      .patch(postId)
      .set({
        likedBy: newLikedBy,
        likeCount: newLikeCount,
      })
      .commit();

    const response: LikeToggleResponse = {
      success: true,
      isLiked: !isCurrentlyLiked,
      likeCount: newLikeCount,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('좋아요 토글 오류:', error);
    return NextResponse.json({ error: '좋아요 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 좋아요 토글 API (POST 메서드)
export async function POST(req: NextRequest) {
  // 기본 사용자 권한 확인 (level 1 이상)
  return withPermission(req, 1, likeToggleHandler);
}
