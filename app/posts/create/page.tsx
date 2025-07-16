'use client';
import { Box, Text, Button, Flex, TextField, Select } from '@radix-ui/themes';
import Container from '@/components/Container';
import { ArrowLeft, Save, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import MarkdownEditor from '@/components/MarkdownEditor';
import FileUpload from '@/components/FileUpload';
import type { PostInput } from '@/model/post';

export default function CreatePostPage() {
  const { data: session } = useSession();
  const [formData, setFormData] = useState<PostInput>({
    title: '',
    content: '',
    author: session?.user?.name || '',
    category: 'general',
    isPublished: false,
    attachments: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ title?: string }>({});
  const router = useRouter();

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
        <Flex align="center" gap="3" mb="4">
          <Button variant="soft" onClick={() => router.back()} size="2">
            <ArrowLeft size={16} />
            뒤로가기
          </Button>
          <Text size="6" weight="bold">
            새 포스트 작성
          </Text>
        </Flex>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  category: value as
                    | 'notice'
                    | 'event'
                    | 'general'
                    | 'tournament_schedule'
                    | 'tournament_info',
                })
              }
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
