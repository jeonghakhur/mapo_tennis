'use client';
import { Box, Text, Button, Flex, TextField, Select } from '@radix-ui/themes';
import Container from '@/components/Container';
import { Save, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePost, usePosts } from '@/hooks/usePosts';
import MarkdownEditor from '@/components/MarkdownEditor';
import FileUpload from '@/components/FileUpload';
import type { PostInput } from '@/model/post';
import { use } from 'react';
import SkeletonCard from '@/components/SkeletonCard';
import LoadingOverlay from '@/components/LoadingOverlay';

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

  const { post, isLoading } = usePost(id);
  const { updatePost } = usePosts();
  const [formData, setFormData] = useState<PostInput>({
    title: '',
    content: '',
    author: session?.user?.id || '',
    category: 'general',
    isPublished: false,
    attachments: [],
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; author?: string }>({});
  const [actionLoading, setActionLoading] = useState(false);

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
        author: { _ref: post.author_id },
        category: post.category,
        isPublished: post.isPublished,
        attachments: post.attachments || [],
      });
    }
    console.log(post);
  }, [post]);

  const validateForm = () => {
    const newErrors: { title?: string; author?: string } = {};

    if (!formData.title.trim()) {
      newErrors.title = '제목을 입력해 주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (publish: boolean) => {
    if (!validateForm()) return;
    setActionLoading(true);
    setIsSaving(true);
    try {
      // author가 string이면 {_ref: author}로 변환
      const authorObj =
        typeof formData.author === 'string' ? { _ref: formData.author } : formData.author;
      await updatePost(id, { ...formData, author: authorObj, isPublished: publish });
      alert(publish ? '포스트가 발행되었습니다.' : '포스트가 저장되었습니다.');
      router.push('/posts');
    } catch {
      alert('저장 실패');
    } finally {
      setIsSaving(false);
      setActionLoading(false);
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
        {actionLoading && <LoadingOverlay />}
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
              onValueChange={(value) => setFormData({ ...formData, mainPriority: Number(value) })}
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
            <Button
              type="button"
              variant="soft"
              onClick={() => handleSave(false)}
              disabled={isSaving}
              size="3"
            >
              <Save size={16} />
              저장
            </Button>
            <Button type="button" onClick={() => handleSave(true)} disabled={isSaving} size="3">
              <Eye size={16} />
              발행
            </Button>
          </Flex>
        </form>
      </Box>
    </Container>
  );
}
