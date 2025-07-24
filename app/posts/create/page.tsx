'use client';
import { Box, Text, Button, Flex, TextField, Select } from '@radix-ui/themes';
import Container from '@/components/Container';
import { Save, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import MarkdownEditor from '@/components/MarkdownEditor';
import FileUpload from '@/components/FileUpload';
import type { PostInput } from '@/model/post';
import { useEffect } from 'react';
import { usePosts } from '@/hooks/usePosts';
import { useLoading } from '@/hooks/useLoading';
import LoadingOverlay from '@/components/LoadingOverlay';
import SkeletonCard from '@/components/SkeletonCard';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function CreatePostPage() {
  const { data: session } = useSession();
  const router = useRouter();

  // 회원 레벨 4 이상인지 확인
  const canManagePosts = session?.user?.level >= 4;

  const [formData, setFormData] = useState<PostInput>({
    title: '',
    content: '',
    author: { _ref: session?.user?.id || '' },
    category: 'general',
    isPublished: false,
    attachments: [],
  });
  const { loading, withLoading } = useLoading();
  const [errors, setErrors] = useState<{ title?: string; author?: string }>({});
  const [dialog, setDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    color?: 'green' | 'red';
  }>({ open: false, title: '', description: '', color: 'green' });

  const { createPost } = usePosts();

  // 권한이 없는 경우 포스트 목록으로 리다이렉트
  useEffect(() => {
    if (session && !canManagePosts) {
      router.push('/posts');
    }

    if (session) {
      setFormData((prev) => ({
        ...prev,
        author: { _ref: session.user.id },
      }));
    }
  }, [session, canManagePosts, router]);

  if (!session) {
    return (
      <Container>
        <Box>
          <SkeletonCard lines={6} />
        </Box>
      </Container>
    );
  }

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

  const validateForm = () => {
    const newErrors: { title?: string; author?: string } = {};

    if (!formData.title.trim()) {
      newErrors.title = '제목을 입력해 주세요.';
    }
    if (!formData.author || !formData.author._ref) {
      newErrors.author = '작성자 정보가 올바르지 않습니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    await withLoading(async () => {
      try {
        await createPost(formData);
        setDialog({
          open: true,
          title: '성공',
          description: '포스트가 생성되었습니다.',
          color: 'green',
        });
        // setTimeout(() => router.push('/posts'), 1000);
      } catch {
        setDialog({
          open: true,
          title: '실패',
          description: '포스트 생성에 실패했습니다.',
          color: 'red',
        });
      }
    });
  };

  const handleSave = async (publish: boolean) => {
    if (!validateForm()) return;
    await withLoading(async () => {
      try {
        await createPost({ ...formData, isPublished: publish });
        setDialog({
          open: true,
          title: '성공',
          description: publish ? '포스트가 발행되었습니다.' : '포스트가 임시저장되었습니다.',
          color: 'green',
        });
        // setTimeout(() => router.push('/posts'), 1000);
      } catch {
        setDialog({
          open: true,
          title: '실패',
          description: '포스트 저장에 실패했습니다.',
          color: 'red',
        });
      }
    });
  };

  return (
    <Container>
      <Box>
        {loading && <LoadingOverlay />}
        <ConfirmDialog
          open={dialog.open}
          onOpenChange={(open) => {
            setDialog({ ...dialog, open });
            if (!open && dialog.title === '성공') {
              router.push('/posts');
            }
          }}
          title={dialog.title}
          description={dialog.description}
          confirmText="확인"
          confirmColor={dialog.color}
          onConfirm={() => setDialog({ ...dialog, open: false })}
        />
        <form onSubmit={handleSubmit} className="space-y-4">
          <Flex align="center" gap="3">
            <Select.Root
              size="3"
              value={formData.category}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  category: value as
                    | 'notice'
                    | 'event'
                    | 'general'
                    | 'tournament_rules'
                    | 'tournament_info',
                })
              }
            >
              <Select.Trigger placeholder="카테고리" />
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
              onValueChange={(value) => setFormData({ ...formData, mainPriority: Number(value) })}
            >
              <Select.Trigger placeholder="메인노출순서" />
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
            <Button
              type="button"
              variant="soft"
              onClick={() => handleSave(false)}
              disabled={loading}
              size="3"
            >
              <Save size={16} />
              임시저장
            </Button>
            <Button type="button" onClick={() => handleSave(true)} disabled={loading} size="3">
              <Eye size={16} />
              발행
            </Button>
          </Flex>
        </form>
      </Box>
    </Container>
  );
}
