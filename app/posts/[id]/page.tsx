'use client';
import { Box, Text, Button, Flex, Badge, Card } from '@radix-ui/themes';
import Container from '@/components/Container';
import { Edit, Trash2, Image, FileText, File } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { usePost } from '@/hooks/usePosts';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import type { Attachment } from '@/model/post';
import { use } from 'react';
import SkeletonCard from '@/components/SkeletonCard';
import LoadingOverlay from '@/components/LoadingOverlay';
import { useState } from 'react';

interface PostDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function PostDetailPage({ params }: PostDetailPageProps) {
  const { id } = use(params);
  const { post, isLoading } = usePost(id);
  const router = useRouter();
  const [actionLoading, setActionLoading] = useState(false);

  const handleDelete = async () => {
    if (!post || !confirm(`"${post.title}" 포스트를 삭제하시겠습니까?`)) return;
    setActionLoading(true);
    try {
      await fetch(`/api/posts?id=${id}`, { method: 'DELETE' });
      alert('포스트가 삭제되었습니다.');
      router.push('/posts');
    } catch (error) {
      console.error('포스트 삭제 실패:', error);
      alert('포스트 삭제 중 오류가 발생했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    const categoryMap = {
      notice: '공지사항',
      event: '이벤트',
      general: '일반',
    };
    return categoryMap[category as keyof typeof categoryMap] || category;
  };

  const getCategoryColor = (category: string) => {
    const colorMap: Record<string, 'red' | 'blue' | 'gray'> = {
      notice: 'red',
      event: 'blue',
      general: 'gray',
    };
    return colorMap[category] || 'gray';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
        <Card className="p-6">
          <div className="space-y-4">
            {/* 헤더 */}
            <div className="flex items-center gap-2 mb-4">
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

            {/* 제목 */}
            <div>
              <Text size="6" weight="bold" className="block mb-2">
                {post.title}
              </Text>
            </div>

            {/* 메타 정보 */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 border-b pb-4">
              <span>
                작성자: {typeof post.author === 'string' ? post.author : post.author?.name || ''}
              </span>
              <span>생성일: {formatDate(post.createdAt)}</span>
              {post.updatedAt && <span>수정일: {formatDate(post.updatedAt)}</span>}
              {post.publishedAt && <span>발행일: {formatDate(post.publishedAt)}</span>}
            </div>

            {/* 내용 */}
            <div className="pt-4">
              <MarkdownRenderer content={post.content} />
            </div>

            {/* 첨부파일 */}
            {post.attachments && post.attachments.length > 0 && (
              <div className="pt-4 border-t">
                <Text size="3" weight="bold" className="block mb-3">
                  첨부파일
                </Text>
                <div className="space-y-2">
                  {post.attachments.map((attachment: Attachment, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                    >
                      <div className="flex items-center gap-2">
                        {attachment.type.startsWith('image/') ? (
                          // eslint-disable-next-line jsx-a11y/alt-text
                          <Image size={16} />
                        ) : attachment.type === 'application/pdf' ? (
                          <FileText size={16} />
                        ) : (
                          <File size={16} />
                        )}
                        <div>
                          <Text size="2" weight="bold">
                            {attachment.filename}
                          </Text>
                          <Text size="1" color="gray">
                            {formatFileSize(attachment.size)}
                          </Text>
                        </div>
                      </div>

                      <Button
                        size="2"
                        variant="soft"
                        onClick={() => window.open(attachment.url, '_blank')}
                      >
                        다운로드
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 액션 버튼 */}
            <Flex gap="3" justify="end" pt="4" className="border-t">
              <Button variant="soft" onClick={() => router.push(`/posts/${id}/edit`)} size="3">
                <Edit size={16} />
                수정
              </Button>
              <Button variant="soft" color="red" onClick={handleDelete} size="3">
                <Trash2 size={16} />
                삭제
              </Button>
            </Flex>
          </div>
        </Card>
      </Box>
    </Container>
  );
}
