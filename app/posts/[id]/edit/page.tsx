'use client';
import { Box, Text, Button, Flex, TextField, Select } from '@radix-ui/themes';
import Container from '@/components/Container';
import { ArrowLeft, Save, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePost } from '@/hooks/usePosts';
import MarkdownEditor from '@/components/MarkdownEditor';
import FileUpload from '@/components/FileUpload';
import type { PostInput } from '@/model/post';
import { use } from 'react';

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
  const [formData, setFormData] = useState<PostInput>({
    title: '',
    content: '',
    author: session?.user?.name || '',
    category: 'general',
    isPublished: false,
    attachments: [],
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{ title?: string }>({});

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
        author: post.author, // 기존 작성자 정보 유지
        category: post.category,
        isPublished: post.isPublished,
        attachments: post.attachments || [],
      });
    }
    console.log(post);
  }, [post]);

  const validateForm = () => {
    const newErrors: { title?: string } = {};

    if (!formData.title.trim()) {
      newErrors.title = '제목을 입력해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (publish: boolean) => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    const updatedData = { ...formData, isPublished: publish };

    try {
      const response = await fetch(`/api/posts?id=${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      if (response.ok) {
        await response.json();
        alert(publish ? '포스트가 발행되었습니다.' : '포스트가 저장되었습니다.');
        router.push('/posts');
      } else {
        const error = await response.json();
        alert(`저장 실패: ${error.error}`);
      }
    } catch (error) {
      console.error('포스트 저장 실패:', error);
      alert('포스트 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
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
          <Text>포스트를 불러오는 중...</Text>
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
        <Flex align="center" gap="3" mb="4">
          <Button variant="soft" onClick={() => router.back()} size="2">
            <ArrowLeft size={16} />
            뒤로가기
          </Button>
          <Text size="6" weight="bold">
            포스트 수정
          </Text>
        </Flex>

        <form className="space-y-4">
          <div>
            <Text as="div" size="2" weight="bold" mb="2">
              제목 *
            </Text>
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
          </div>

          <MarkdownEditor
            value={formData.content}
            onChange={(value) => setFormData({ ...formData, content: value })}
          />

          <FileUpload
            attachments={formData.attachments || []}
            onAttachmentsChange={(attachments) => setFormData({ ...formData, attachments })}
          />

          <div>
            <Text as="div" size="2" weight="bold" mb="2">
              카테고리 *
            </Text>
            <Select.Root
              value={formData.category}
              onValueChange={(value) => {
                if (!value) return;

                setFormData({
                  ...formData,
                  category: value as
                    | 'notice'
                    | 'event'
                    | 'general'
                    | 'tournament_schedule'
                    | 'tournament_info',
                });
              }}
            >
              <Select.Trigger />
              <Select.Content>
                <Select.Item value="general">일반</Select.Item>
                <Select.Item value="notice">공지사항</Select.Item>
                <Select.Item value="event">이벤트</Select.Item>
                <Select.Item value="tournament_schedule">대회일정</Select.Item>
                <Select.Item value="tournament_info">대회요강</Select.Item>
              </Select.Content>
            </Select.Root>
          </div>

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
