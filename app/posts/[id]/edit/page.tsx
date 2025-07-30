'use client';
import { Box, Text, Button, Flex, TextField, Select } from '@radix-ui/themes';
import Container from '@/components/Container';
import { Save, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import MarkdownEditor from '@/components/MarkdownEditor';
import FileUpload from '@/components/FileUpload';
import type { PostInput } from '@/model/post';
import { use } from 'react';
import SkeletonCard from '@/components/SkeletonCard';
import LoadingOverlay from '@/components/LoadingOverlay';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useLoading } from '@/hooks/useLoading';
import { usePost } from '@/hooks/usePosts';
import { usePosts } from '@/hooks/usePosts';

interface EditPostPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditPostPage({ params }: EditPostPageProps) {
  const { id } = use(params);
  const { data: session } = useSession();
  const router = useRouter();

  // 회원 레벨 4 이상인지 확인
  const canManagePosts = session?.user?.level >= 4;

  const { updatePost, deletePost } = usePosts();
  const { post, isLoading } = usePost(id);
  const [formData, setFormData] = useState<PostInput>({
    title: '',
    content: '',
    author: { _ref: session?.user?.id || '' },
    category: 'general',
    isPublished: false,
    attachments: [],
  });
  const [errors, setErrors] = useState<{ title?: string; author?: string }>({});
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const { loading, withLoading } = useLoading();

  // 권한이 없는 경우 포스트 목록으로 리다이렉트
  useEffect(() => {
    if (session && !canManagePosts) {
      router.push('/posts');
    }
  }, [session, canManagePosts, router]);

  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title,
        content: post.content,
        author: { _ref: post.author?._id || session?.user?.id },
        category: post.category,
        isPublished: post.isPublished,
        attachments: post.attachments || [],
        mainPriority: post.mainPriority, // 추가!
      });
    }
  }, [post, session]);

  const validateForm = () => {
    const newErrors: { title?: string; author?: string } = {};

    if (!formData.title.trim()) {
      newErrors.title = '제목을 입력해 주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // handleSave에서 publish 인자 제거
  const handleSave = async () => {
    if (!validateForm()) return;
    try {
      await withLoading(async () => await updatePost(id, { ...formData }));
      // console.log('handleSave result', result);
      setShowSuccessDialog(true);
    } catch (error) {
      alert('저장 실패: ' + error);
    }
  };

  const handleDelete = async () => {
    if (!post || !confirm(`"${post.title}" 포스트를 삭제하시겠습니까?`)) return;
    try {
      await withLoading(async () => await deletePost(id));
      alert('포스트가 삭제되었습니다.');
      router.push('/');
    } catch (error) {
      console.error('포스트 삭제 실패:', error);
      alert('포스트 삭제 중 오류가 발생했습니다.');
    } finally {
    }
  };

  const handlePublish = async (id: string, isPublished: boolean) => {
    if (!canManagePosts || !post) return;
    try {
      await withLoading(
        async () => await updatePost(id, { ...formData, isPublished: !isPublished }),
      );
    } catch (error: unknown) {
      let msg = '';
      if (error instanceof Error) msg = error.message;
      alert('포스트 상태 변경에 실패했습니다: ' + msg);
    }
  };

  // 권한이 없는 경우 로딩 상태 표시
  if (session && !canManagePosts) {
    return (
      <Container>
        <Box>
          <Text>권한이 없습니다.</Text>
        </Box>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container>
        <Box>
          <SkeletonCard lines={6} />
        </Box>
      </Container>
    );
  }

  if (!post) {
    return (
      <Container>
        <Box>
          <Text>포스트를 찾을 수 없습니다.</Text>
        </Box>
      </Container>
    );
  }

  return (
    <Container>
      <Box>
        {loading && <LoadingOverlay />}
        <ConfirmDialog
          title="수정 완료"
          description="포스트가 수정되었습니다."
          confirmText="확인"
          confirmColor="green"
          open={showSuccessDialog}
          onOpenChange={setShowSuccessDialog}
          onConfirm={() => router.push('/')}
        />
        <form className="space-y-4">
          <Flex align="center" gap="3">
            <Select.Root
              size="3"
              value={formData.category}
              onValueChange={(value) => {
                if (!value) return;
                setFormData({
                  ...formData,
                  category: value as
                    | 'notice'
                    | 'event'
                    | 'general'
                    | 'tournament_rules'
                    | 'tournament_info',
                });
              }}
            >
              <Select.Trigger />
              <Select.Content>
                <Select.Item value="general">일반</Select.Item>
                <Select.Item value="notice">공지사항</Select.Item>
                <Select.Item value="event">이벤트</Select.Item>
                <Select.Item value="tournament_rules">대회규칙</Select.Item>
                <Select.Item value="tournament_info">대회요강</Select.Item>
              </Select.Content>
            </Select.Root>
            <Select.Root
              size="3"
              value={formData.mainPriority !== undefined ? String(formData.mainPriority) : '0'}
              onValueChange={(value) => {
                console.log(value);
                if (!value) return;
                setFormData({ ...formData, mainPriority: Number(value) });
              }}
            >
              <Select.Trigger placeholder="메인 노출 안함" />
              <Select.Content>
                <Select.Item value="0">메인 노출 안함</Select.Item>
                <Select.Item value="1">1</Select.Item>
                <Select.Item value="2">2</Select.Item>
                <Select.Item value="3">3</Select.Item>
                <Select.Item value="4">4</Select.Item>
                <Select.Item value="5">5</Select.Item>
              </Select.Content>
            </Select.Root>
          </Flex>
          <div>
            <TextField.Root
              size="3"
              placeholder="포스트 제목을 입력하세요"
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
                if (errors.title) {
                  setErrors({ ...errors, title: undefined });
                }
              }}
              required
              color={errors.title ? 'red' : undefined}
            />
            {errors.title && (
              <Text size="1" color="red" mt="1">
                {errors.title}
              </Text>
            )}
            {errors.author && (
              <Text size="1" color="red" mt="1">
                {errors.author}
              </Text>
            )}
          </div>

          <MarkdownEditor
            value={formData.content}
            onChange={(value) => setFormData({ ...formData, content: value })}
          />

          <FileUpload
            attachments={formData.attachments || []}
            onAttachmentsChange={(attachments) => setFormData({ ...formData, attachments })}
          />

          <Flex gap="3" justify="end" pt="4">
            <Button type="button" variant="soft" color="red" onClick={handleDelete} size="3">
              <Trash2 size={16} />
              삭제
            </Button>
            <Button
              size="3"
              variant="soft"
              type="button"
              color={post.isPublished ? 'orange' : 'green'}
              onClick={() => handlePublish(post._id, post.isPublished)}
            >
              {post.isPublished ? '임시저장' : '발행'}
            </Button>
            <Button type="button" variant="soft" onClick={handleSave} size="3">
              <Save size={16} />
              저장
            </Button>
          </Flex>
        </form>
      </Box>
    </Container>
  );
}
