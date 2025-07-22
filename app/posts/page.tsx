'use client';
import { Box, Text, Button, Flex, Badge, Card, TextField, Select } from '@radix-ui/themes';
import Container from '@/components/Container';
import { Edit, Trash2, Search, NotebookPen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { usePosts } from '@/hooks/usePosts';
import type { Post } from '@/model/post';
import { useUser } from '@/hooks/useUser';
import { hasPermissionLevel } from '@/lib/authUtils';
import SkeletonCard from '@/components/SkeletonCard';
import LoadingOverlay from '@/components/LoadingOverlay';

export default function PostsPage() {
  const { data: session } = useSession();
  const { user } = useUser(session?.user?.email);
  const [showAll, setShowAll] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const { posts, isLoading, deletePost } = usePosts(showAll);
  const router = useRouter();
  const [actionLoading, setActionLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    if (user) {
      setHasPermission(hasPermissionLevel(user, 4));
    } else {
      setHasPermission(null);
    }
  }, [user]);

  if (hasPermission === false) {
    return (
      <Container>
        <Box>
          <Text color="red" size="4" weight="bold">
            접근 권한이 없습니다.
          </Text>
          <Text color="gray" size="3" style={{ marginTop: '8px' }}>
            클럽 페이지는 레벨 4 이상의 사용자만 접근할 수 있습니다.
          </Text>
        </Box>
      </Container>
    );
  }

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

  const handleDelete = async (id: string, title: string) => {
    if (!canManagePosts) return;
    if (confirm(`"${title}" 포스트를 삭제하시겠습니까?`)) {
      setActionLoading(true);
      try {
        await deletePost(id);
      } catch {
        alert('삭제 실패');
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handlePublish = async (id: string, isPublished: boolean) => {
    if (!canManagePosts) return;

    try {
      const action = isPublished ? 'unpublish' : 'publish';
      const response = await fetch(`/api/posts?id=${id}&action=${action}`, {
        method: 'PATCH',
      });

      if (response.ok) {
        // SWR 캐시 갱신
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`포스트 상태 변경에 실패했습니다: ${error.error}`);
      }
    } catch (error) {
      console.error('포스트 상태 변경 오류:', error);
      alert('포스트 상태 변경 중 오류가 발생했습니다.');
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, 'blue' | 'green' | 'orange' | 'red' | 'purple'> = {
      notice: 'red',
      event: 'orange',
      general: 'blue',
      tournament_schedule: 'green',
      tournament_info: 'purple',
    };
    return colors[category] || 'blue';
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      notice: '공지사항',
      event: '이벤트',
      general: '일반',
      tournament_rules: '대회일정',
      tournament_info: '대회요강',
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
          {actionLoading && <LoadingOverlay />}
          {/* 필터 및 검색 영역 */}
          <div className="flex items-center gap-4 mb-6">
            {/* 카테고리 필터 */}
            <Select.Root value={selectedCategory} onValueChange={setSelectedCategory}>
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
                placeholder="제목이나 내용으로 검색..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
              <Search
                size={16}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
            </div>

            {/* 발행 상태 필터 (레벨 4 이상만) */}
            {canManagePosts && (
              <Flex align="center" gap="3">
                <Button
                  variant={showAll ? 'soft' : 'solid'}
                  onClick={() => setShowAll(false)}
                  size="2"
                >
                  발행된 포스트만
                </Button>
                <Button
                  variant={showAll ? 'solid' : 'soft'}
                  onClick={() => setShowAll(true)}
                  size="2"
                >
                  모든 포스트
                </Button>
              </Flex>
            )}
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
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge color={getCategoryColor(post.category)} size="2">
                            {getCategoryLabel(post.category)}
                          </Badge>
                          {session?.user?.role === 'admin' &&
                            (post.isPublished ? (
                              <Badge color="green" size="2">
                                발행됨
                              </Badge>
                            ) : (
                              <Badge color="gray" size="2">
                                임시저장
                              </Badge>
                            ))}
                        </div>

                        <Text weight="bold" size="4" className="block mb-1">
                          {post.title}
                        </Text>

                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>
                            작성자:
                            {typeof post.author === 'string'
                              ? post.author
                              : post.author?.name || ''}
                          </span>
                          <span>생성일: {formatDate(post.createdAt)}</span>
                          {post.publishedAt && <span>발행일: {formatDate(post.publishedAt)}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {canManagePosts && (
                          <>
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
                          </>
                        )}
                      </div>
                    </div>
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
