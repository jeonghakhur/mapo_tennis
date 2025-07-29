import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { mutate as globalMutate } from 'swr';
import type { LikeToggleResponse } from '@/model/post';

interface UsePostLikeProps {
  postId: string;
  initialLikeCount?: number;
  initialIsLiked?: boolean;
}

export function usePostLike({
  postId,
  initialLikeCount = 0,
  initialIsLiked = false,
}: UsePostLikeProps) {
  const { data: session } = useSession();
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isLoading, setIsLoading] = useState(false);

  // 좋아요 토글 함수 (낙관적 업데이트 적용)
  const toggleLike = async () => {
    if (!session?.user) {
      alert('로그인이 필요합니다.');
      return;
    }

    // 현재 상태 저장 (롤백용)
    const previousLikeCount = likeCount;
    const previousIsLiked = isLiked;

    // 낙관적 업데이트 - 즉시 UI 반영
    const newLikeCount = isLiked ? Math.max(0, likeCount - 1) : likeCount + 1;
    const newIsLiked = !isLiked;

    setLikeCount(newLikeCount);
    setIsLiked(newIsLiked);
    setIsLoading(true);

    try {
      // 서버 요청
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data: LikeToggleResponse = await response.json();

        // 서버 응답으로 최종 상태 업데이트
        setLikeCount(data.likeCount);
        setIsLiked(data.isLiked);

        // 포스트 목록 캐시 갱신
        await globalMutate('/api/posts?all=true');
        await globalMutate('/api/posts?all=false');
      } else {
        // 에러 발생 시 이전 상태로 롤백
        setLikeCount(previousLikeCount);
        setIsLiked(previousIsLiked);

        const errorData = await response.json();
        alert(errorData.error || '좋아요 처리 중 오류가 발생했습니다.');
      }
    } catch (error) {
      // 네트워크 에러 발생 시 이전 상태로 롤백
      setLikeCount(previousLikeCount);
      setIsLiked(previousIsLiked);

      console.error('좋아요 토글 오류:', error);
      alert('좋아요 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    likeCount,
    isLiked,
    isLoading,
    toggleLike,
  };
}
