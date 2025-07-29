'use client';
import { Box, Text, Button, Badge, Card, TextField, Select, Flex } from '@radix-ui/themes';
import Container from '@/components/Container';
import { Search, NotebookPen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { usePosts } from '@/hooks/usePosts';
import type { Post } from '@/model/post';
import SkeletonCard from '@/components/SkeletonCard';
import { hasPermissionLevel } from '@/lib/authUtils';

export default function PostsPage() {
  const { data: session } = useSession();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const { posts, isLoading } = usePosts();
  const router = useRouter();

  // 회원 레벨 4 이상인지 확인
  const canManagePosts = session?.user?.level >= 4;

  // 카테고리 옵션
  const categoryOptions = [
    { value: 'all', label: '전체' },
    { value: 'notice', label: '공지사항' },
    { value: 'event', label: '이벤트' },
    { value: 'general', label: '일반' },
    { value: 'tournament_rules', label: '대회규칙' },
    { value: 'tournament_info', label: '대회요강' },
  ];

  // 필터링된 포스트
  const filteredPosts =
    posts?.filter((post: Post) => {
      // 회원 레벨 4 미만은 발행된 포스트만 볼 수 있음
      if (!hasPermissionLevel(session?.user, 4) && !post.isPublished) {
        return false;
      }
      // 카테고리 필터
      if (selectedCategory !== 'all' && post.category !== selectedCategory) {
        return false;
      }
      // 검색 필터
      if (searchKeyword.trim()) {
        const keyword = searchKeyword.toLowerCase();
        const titleMatch = post.title.toLowerCase().includes(keyword);
        const contentMatch = post.content.toLowerCase().includes(keyword);
        return titleMatch || contentMatch;
      }
      return true;
    }) || [];

  const getCategoryColor = (category: string) => {
    const colors: Record<string, 'blue' | 'green' | 'orange' | 'red' | 'purple'> = {
      notice: 'red',
      event: 'orange',
      general: 'blue',
      tournament_rules: 'green',
      tournament_info: 'purple',
    };
    return colors[category] || 'blue';
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      notice: '공지사항',
      event: '이벤트',
      general: '일반',
      tournament_rules: '대회규칙',
    };
    return labels[category] || '일반';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  if (isLoading) {
    return (
      <Container>
        <Box>
          <SkeletonCard lines={6} />
        </Box>
      </Container>
    );
  }

  return (
    <Container>
      {isLoading ? (
        <SkeletonCard />
      ) : (
        <Box>
          <div className="flex items-center gap-4 mb-6">
            {/* 카테고리 필터 */}
            <Select.Root size="3" value={selectedCategory} onValueChange={setSelectedCategory}>
              <Select.Trigger />
              <Select.Content>
                {categoryOptions.map((option) => (
                  <Select.Item key={option.value} value={option.value}>
                    {option.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>

            {/* 검색 */}
            <div className="relative flex-1">
              <TextField.Root
                size="3"
                placeholder="제목이나 내용으로 검색..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
              <Search
                size={16}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
            </div>
          </div>

          {/* 결과 개수 표시 */}
          <div className="mb-4">
            <Text size="2" color="gray">
              총 {filteredPosts.length}개의 포스트
              {selectedCategory !== 'all' && ` (${getCategoryLabel(selectedCategory)} 카테고리)`}
              {searchKeyword && ` (검색어: "${searchKeyword}")`}
            </Text>
          </div>

          <div className="space-y-4">
            {filteredPosts.length === 0 ? (
              <Box className="text-center py-8">
                <Text size="4" color="gray">
                  {searchKeyword ? '검색 결과가 없습니다.' : '포스트가 없습니다.'}
                </Text>
              </Box>
            ) : (
              filteredPosts.map((post: Post) => {
                return (
                  <Card
                    key={post._id}
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => router.push(`/posts/${post._id}`)}
                  >
                    {' '}
                    <Flex mb="2" gap="2" justify="between">
                      <Flex gap="2">
                        {hasPermissionLevel(session?.user, 4) &&
                          (post.isPublished ? (
                            <Badge color="green" size="2">
                              발행됨
                            </Badge>
                          ) : (
                            <Badge color="gray" size="2">
                              임시저장
                            </Badge>
                          ))}

                        <Badge color={getCategoryColor(post.category)} size="2">
                          {getCategoryLabel(post.category)}
                        </Badge>
                      </Flex>
                      <Box>{formatDate(post.publishedAt || formatDate(post.createdAt))}</Box>
                    </Flex>
                    <Box>
                      <Text weight="bold" size="4" className="block mb-1">
                        {post.title}
                      </Text>
                    </Box>
                  </Card>
                );
              })
            )}
          </div>

          {/* 플로팅 새 포스트 작성 버튼 */}
          {canManagePosts && (
            <div
              style={{
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                zIndex: 1000,
              }}
            >
              <Button
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#2563eb',
                  color: '#fff',
                }}
                onClick={() => router.push('/posts/create')}
              >
                <NotebookPen size={24} />
              </Button>
            </div>
          )}
        </Box>
      )}
    </Container>
  );
}
