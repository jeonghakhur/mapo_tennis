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
  const [isDeleting, setIsDeleting] = useState<string | null>(null); // 삭제 중인 코멘트 ID

  // 코멘트 목록 조회 (useCallback으로 메모이제이션)
  const fetchComments = useCallback(async () => {
    try {
      const response = await fetch(`/api/comments?postId=${postId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('코멘트 조회 성공:', data);
        setComments(data.comments || []);
      } else {
        const errorData = await response.json();
        console.error('코멘트 조회 실패:', errorData);
      }
    } catch (error) {
      console.error('코멘트 조회 네트워크 오류:', error);
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

    // 낙관적 업데이트를 위한 임시 코멘트
    const tempComment: Comment = {
      _id: `temp-${Date.now()}`,
      _type: 'comment',
      content: content.trim(),
      author: {
        _id: session.user.id,
        _ref: session.user.id,
        name: session.user.name || '',
      },
      post: { _ref: postId },
      createdAt: new Date().toISOString(),
    };

    // 낙관적 업데이트 - 즉시 UI에 반영
    setComments((prev) => [tempComment, ...prev]);

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
          post: { _ref: postId }, // 참조 타입으로 전송
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // 서버에서 최신 코멘트 목록을 다시 조회하여 정확한 데이터로 업데이트
        await fetchComments();

        // 현재 포스트의 캐시만 무효화 (성능 최적화)
        await globalMutate('/api/posts?all=true');
        await globalMutate('/api/posts?all=false');

        return data.comment;
      } else {
        // 실패 시 낙관적 업데이트 롤백
        setComments((prev) => prev.filter((c) => c._id !== tempComment._id));
        console.error('코멘트 생성 응답 오류:', data);
        alert(data.error || '코멘트 생성 중 오류가 발생했습니다.');
      }
    } catch (error) {
      // 네트워크 오류 시 낙관적 업데이트 롤백
      setComments((prev) => prev.filter((c) => c._id !== tempComment._id));
      console.error('코멘트 생성 네트워크 오류:', error);
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

    // 삭제 중 상태 설정
    setIsDeleting(commentId);

    // 낙관적 업데이트 - 즉시 UI에서 제거
    setComments((prev) => prev.filter((c) => c._id !== commentId));

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // 성공 시 서버 재조회 없이 바로 완료 (낙관적 업데이트 유지)
        await globalMutate('/api/posts?all=true');
        await globalMutate('/api/posts?all=false');
      } else {
        // 실패 시 낙관적 업데이트 롤백
        await fetchComments();
        const errorData = await response.json();
        alert(errorData.error || '코멘트 삭제 중 오류가 발생했습니다.');
      }
    } catch (error) {
      // 네트워크 오류 시 낙관적 업데이트 롤백
      await fetchComments();
      console.error('코멘트 삭제 오류:', error);
      alert('코멘트 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(null);
    }
  };

  return {
    comments,
    isCreating,
    isDeleting,
    fetchComments,
    createComment,
    deleteComment,
  };
}
