'use client';
import { Box, Text, Button, Flex, Badge, Card } from '@radix-ui/themes';
import Container from '@/components/Container';
import { Plus, Eye, Edit, Trash2, File } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { usePosts } from '@/hooks/usePosts';
import type { Post } from '@/model/post';

export default function PostsPage() {
  const [showAll, setShowAll] = useState(false);
  const { posts, isLoading } = usePosts(showAll);
  const router = useRouter();

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`"${title}" 포스트를 삭제하시겠습니까?`)) return;

    try {
      await fetch(`/api/posts?id=${id}`, { method: 'DELETE' });
      // SWR이 자동으로 새로고침됨
    } catch (error) {
      console.error('포스트 삭제 실패:', error);
    }
  };

  const handlePublish = async (id: string, isPublished: boolean) => {
    try {
      const action = isPublished ? 'unpublish' : 'publish';
      await fetch(`/api/posts?id=${id}&action=${action}`, { method: 'PATCH' });
      // SWR이 자동으로 새로고침됨
    } catch (error) {
      console.error('포스트 발행 상태 변경 실패:', error);
    }
  };

  const getCategoryLabel = (category: string) => {
    const categoryMap = {
      notice: '공지사항',
      event: '이벤트',
      general: '일반',
      tournament_schedule: '대회일정',
      tournament_info: '대회요강',
    };
    return categoryMap[category as keyof typeof categoryMap] || category;
  };

  const getCategoryColor = (category: string) => {
    const colorMap: Record<string, 'red' | 'blue' | 'gray' | 'green' | 'orange'> = {
      notice: 'red',
      event: 'blue',
      general: 'gray',
      tournament_schedule: 'green',
      tournament_info: 'orange',
    };
    return colorMap[category] || 'gray';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  if (isLoading) {
    return (
      <Container>
        <Box>
          <Text>포스트를 불러오는 중...</Text>
        </Box>
      </Container>
    );
  }

  return (
    <Container>
      <Box>
        <Flex align="center" justify="between" mb="4">
          <Text size="6" weight="bold">
            포스트 관리
          </Text>
          <Button onClick={() => router.push('/posts/create')} size="3">
            <Plus size={16} />새 포스트 작성
          </Button>
        </Flex>

        <Flex align="center" gap="3" mb="4">
          <Button
            variant={showAll ? 'solid' : 'soft'}
            onClick={() => setShowAll(!showAll)}
            size="2"
          >
            {showAll ? '발행된 포스트만' : '모든 포스트'}
          </Button>
        </Flex>

        {posts.length === 0 ? (
          <Box className="text-center py-8">
            <Text size="4" color="gray">
              포스트가 없습니다.
            </Text>
          </Box>
        ) : (
          <div className="space-y-3">
            {posts.map((post: Post) => (
              <Card key={post._id} className="p-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge color={getCategoryColor(post.category)} size="2">
                        {getCategoryLabel(post.category)}
                      </Badge>
                      {post.isPublished ? (
                        <Badge color="green" size="2">
                          발행됨
                        </Badge>
                      ) : (
                        <Badge color="gray" size="2">
                          임시저장
                        </Badge>
                      )}
                    </div>

                    <Text weight="bold" size="4" className="block mb-1">
                      {post.title}
                    </Text>

                    <Text size="2" color="gray" className="block mb-2">
                      {post.content.length > 100
                        ? `${post.content.substring(0, 100)}...`
                        : post.content}
                    </Text>

                    {post.attachments && post.attachments.length > 0 && (
                      <div className="flex items-center gap-1 mb-2">
                        <File size={12} />
                        <Text size="1" color="gray">
                          첨부파일 {post.attachments.length}개
                        </Text>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>작성자: {post.author}</span>
                      <span>생성일: {formatDate(post.createdAt)}</span>
                      {post.publishedAt && <span>발행일: {formatDate(post.publishedAt)}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="2"
                      variant="soft"
                      onClick={() => router.push(`/posts/${post._id}`)}
                    >
                      <Eye size={14} />
                    </Button>
                    <Button
                      size="2"
                      variant="soft"
                      onClick={() => router.push(`/posts/${post._id}/edit`)}
                    >
                      <Edit size={14} />
                    </Button>
                    <Button
                      size="2"
                      variant="soft"
                      color="red"
                      onClick={() => handleDelete(post._id, post.title)}
                    >
                      <Trash2 size={14} />
                    </Button>
                    <Button
                      size="2"
                      variant="soft"
                      color={post.isPublished ? 'orange' : 'green'}
                      onClick={() => handlePublish(post._id, post.isPublished)}
                    >
                      {post.isPublished ? '임시저장' : '발행'}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Box>
    </Container>
  );
}
