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
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ title?: string }>({});

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
    const newErrors: { title?: string } = {};

    if (!formData.title.trim()) {
      newErrors.title = '제목을 입력해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await response.json();
        alert('포스트가 생성되었습니다.');
        router.push('/posts');
      } else {
        const error = await response.json();
        alert(`생성 실패: ${error.error}`);
      }
    } catch (error) {
      console.error('포스트 생성 실패:', error);
      alert('포스트 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (publish: boolean) => {
    if (!validateForm()) {
      return;
    }

    const updatedData = { ...formData, isPublished: publish };
    setFormData(updatedData);

    setIsLoading(true);
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      if (response.ok) {
        await response.json();
        alert(publish ? '포스트가 발행되었습니다.' : '포스트가 임시저장되었습니다.');
        router.push('/posts');
      } else {
        const error = await response.json();
        alert(`저장 실패: ${error.error}`);
      }
    } catch (error) {
      console.error('포스트 저장 실패:', error);
      alert('포스트 저장 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container>
      <Box>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Flex align="center" gap="3">
            <Text as="div" size="3" weight="bold">
              카테고리
            </Text>
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
              <Select.Trigger />
              <Select.Content>
                <Select.Item value="general">일반</Select.Item>
                <Select.Item value="notice">공지사항</Select.Item>
                <Select.Item value="event">이벤트</Select.Item>
                <Select.Item value="tournament_rules">대회규칙</Select.Item>
                <Select.Item value="tournament_info">대회요강</Select.Item>
              </Select.Content>
            </Select.Root>
            <Text as="div" size="2" weight="bold" mb="3">
              메인 노출 순서
            </Text>
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
            <Text as="div" size="3" weight="bold" mb="2">
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

          <Flex gap="3" justify="end" pt="4">
            <Button
              type="button"
              variant="soft"
              onClick={() => handleSave(false)}
              disabled={isLoading}
              size="3"
            >
              <Save size={16} />
              임시저장
            </Button>
            <Button type="button" onClick={() => handleSave(true)} disabled={isLoading} size="3">
              <Eye size={16} />
              발행
            </Button>
          </Flex>
        </form>
      </Box>
    </Container>
  );
}
