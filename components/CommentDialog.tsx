import { useState, useEffect } from 'react';
import { Dialog, TextField, Button, Text, Flex, Box } from '@radix-ui/themes';
import { MessageCircle, Send, Trash2 } from 'lucide-react';
import { useComments } from '@/hooks/useComments';
import { useSession } from 'next-auth/react';
import { useLoading } from '@/hooks/useLoading';
import ConfirmDialog from '@/components/ConfirmDialog';
import LoadingOverlay from '@/components/LoadingOverlay';
import type { Comment } from '@/model/comment';

interface CommentDialogProps {
  postId: string;
  postTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialComments?: Comment[]; // 초기 코멘트 데이터
}

export default function CommentDialog({
  postId,
  postTitle,
  open,
  onOpenChange,
  initialComments = [],
}: CommentDialogProps) {
  const { data: session } = useSession();
  const { comments, isCreating, fetchComments, createComment, deleteComment } = useComments({
    postId,
    initialComments,
  });
  const { loading, withLoading } = useLoading();
  const [newComment, setNewComment] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string>('');

  // 다이얼로그가 열릴 때 코멘트 목록 조회 (초기 데이터가 없을 때만)
  useEffect(() => {
    if (open && initialComments.length === 0) {
      fetchComments();
    }
  }, [open, fetchComments, initialComments.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const result = await createComment(newComment);
    if (result) {
      setNewComment('');
    }
  };

  const handleDelete = async (commentId: string) => {
    setCommentToDelete(commentId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!commentToDelete) return;

    await withLoading(async () => {
      await deleteComment(commentToDelete);
      setCommentToDelete('');
    });
  };

  // 상대적 시간 포맷 함수
  function formatRelativeTime(dateString: string) {
    const now = new Date();
    const date = new Date(dateString);
    const diff = (now.getTime() - date.getTime()) / 1000; // 초 단위
    if (diff < 60) return '방금 전';
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`;
    if (diff < 2419200) return `${Math.floor(diff / 604800)}주 전`;
    return date.toLocaleDateString('ko-KR');
  }

  return (
    <>
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Content style={{ maxWidth: 450 }}>
          {loading && <LoadingOverlay size="3" />}
          <Dialog.Title>
            <Flex align="center" justify="between">
              <Flex align="center" gap="2">
                <MessageCircle size={16} />
                {postTitle}
              </Flex>
              <Button size="1" variant="ghost" onClick={() => onOpenChange(false)}>
                ✕
              </Button>
            </Flex>
          </Dialog.Title>

          <Box style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            {comments.length === 0 ? (
              <Text size="2" color="gray">
                아직 코멘트가 없습니다.
              </Text>
            ) : (
              <Flex direction="column" gap="3">
                {comments.map((comment: Comment) => (
                  <Box key={comment._id} className="border-b pb-3">
                    <Flex justify="between" align="start" gap="2">
                      <Box style={{ flex: 1 }}>
                        <Flex align="center" gap="2" mb="1">
                          <Text weight="bold" size="2">
                            {typeof comment.author === 'string'
                              ? comment.author
                              : comment.author.name}
                          </Text>
                          <Text size="1" color="gray">
                            {formatRelativeTime(comment.createdAt)}
                          </Text>
                        </Flex>
                        <Text size="2">{comment.content}</Text>
                      </Box>
                      {session?.user?.id ===
                        (typeof comment.author === 'string'
                          ? comment.author
                          : comment.author._id) && (
                        <Button
                          size="1"
                          variant="ghost"
                          color="red"
                          onClick={() => handleDelete(comment._id)}
                        >
                          <Trash2 size={12} />
                        </Button>
                      )}
                    </Flex>
                  </Box>
                ))}
              </Flex>
            )}
          </Box>

          {session?.user && (
            <form onSubmit={handleSubmit}>
              <Flex gap="2" mt="4">
                <TextField.Root
                  size="2"
                  placeholder="코멘트를 입력하세요..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  style={{ flex: 1 }}
                  disabled={isCreating}
                />
                <Button size="2" type="submit" disabled={!newComment.trim() || isCreating}>
                  <Send size={14} />
                </Button>
              </Flex>
            </form>
          )}

          {!session?.user && (
            <Text size="2" color="gray" mt="4">
              코멘트를 작성하려면 로그인이 필요합니다.
            </Text>
          )}
        </Dialog.Content>
      </Dialog.Root>

      {/* 로딩 오버레이 */}

      {/* 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        title="코멘트 삭제"
        description="정말로 이 코멘트를 삭제하시겠습니까?"
        confirmText="삭제"
        cancelText="취소"
        confirmColor="red"
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={confirmDelete}
        onCancel={() => {
          setCommentToDelete('');
          setShowDeleteConfirm(false);
        }}
      />
    </>
  );
}
