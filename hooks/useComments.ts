import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { mutate as globalMutate } from 'swr';
import type { Comment } from '@/model/comment';

interface UseCommentsProps {
  postId: string;
  initialComments?: Comment[];
}

export function useComments({ postId, initialComments = [] }: UseCommentsProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [isCreating, setIsCreating] = useState(false);

  // 코멘트 목록 조회 (useCallback으로 메모이제이션)
  const fetchComments = useCallback(async () => {
    try {
      const response = await fetch(`/api/comments?postId=${postId}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      } else {
        console.error('코멘트 조회 실패');
      }
    } catch (error) {
      console.error('코멘트 조회 오류:', error);
    }
  }, [postId]);

  // 코멘트 생성
  const createComment = async (content: string) => {
    if (!session?.user) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (!content.trim()) {
      alert('코멘트 내용을 입력해주세요.');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
          post: postId,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // 서버에서 최신 코멘트 목록을 다시 조회하여 정확한 데이터로 업데이트
        await fetchComments();

        // 포스트 목록 캐시 갱신 (코멘트 수 업데이트)
        await globalMutate('/api/posts?all=true');
        await globalMutate('/api/posts?all=false');

        return data.comment;
      } else {
        const errorData = await response.json();
        alert(errorData.error || '코멘트 생성 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('코멘트 생성 오류:', error);
      alert('코멘트 생성 중 오류가 발생했습니다.');
    } finally {
      setIsCreating(false);
    }
  };

  // 코멘트 삭제
  const deleteComment = async (commentId: string) => {
    if (!session?.user) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // 서버에서 최신 코멘트 목록을 다시 조회하여 정확한 데이터로 업데이트
        await fetchComments();

        // 포스트 목록 캐시 갱신 (코멘트 수 업데이트)
        await globalMutate('/api/posts?all=true');
        await globalMutate('/api/posts?all=false');
      } else {
        const errorData = await response.json();
        alert(errorData.error || '코멘트 삭제 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('코멘트 삭제 오류:', error);
      alert('코멘트 삭제 중 오류가 발생했습니다.');
    }
  };

  return {
    comments,
    isCreating,
    fetchComments,
    createComment,
    deleteComment,
  };
}
