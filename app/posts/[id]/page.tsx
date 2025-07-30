'use client';
import { Box, Text, Button, Flex, Badge } from '@radix-ui/themes';
import Container from '@/components/Container';
import { Edit, Trash2, Image, FileText, File } from 'lucide-react';
import { useRouter } from 'next/navigation';

import MarkdownRenderer from '@/components/MarkdownRenderer';
import type { Attachment } from '@/model/post';
import { use, useEffect } from 'react';
import SkeletonCard from '@/components/SkeletonCard';
import LoadingOverlay from '@/components/LoadingOverlay';
import { useSession } from 'next-auth/react';
import { useLoading } from '@/hooks/useLoading';
import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';
import { useState } from 'react';
import { usePost, usePosts } from '@/hooks/usePosts';

interface PostDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function PostDetailPage({ params }: PostDetailPageProps) {
  const { id } = use(params);
  const { post, isLoading } = usePost(id);
  const { updatePost, deletePost } = usePosts();
  const router = useRouter();
  const { data: session } = useSession();
  const canManagePosts = session?.user?.level >= 4;
  const { loading, withLoading } = useLoading();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const handleDelete = async () => {
    if (!post || !confirm(`"${post.title}" 포스트를 삭제하시겠습니까?`)) return;
    try {
      withLoading(async () => await deletePost(id));
      alert('포스트가 삭제되었습니다.');
      router.push('/posts');
    } catch (error) {
      console.error('포스트 삭제 실패:', error);
      alert('포스트 삭제 중 오류가 발생했습니다.');
    } finally {
    }
  };

  const handlePublish = async (id: string, isPublished: boolean) => {
    if (!canManagePosts || !post) return;

    try {
      withLoading(async () => await updatePost(id, { ...post, isPublished: !isPublished }));
    } catch (error: unknown) {
      let msg = '';
      if (error instanceof Error) msg = error.message;
      alert('포스트 상태 변경에 실패했습니다: ' + msg);
    }
  };

  const getCategoryLabel = (category: string) => {
    const categoryMap = {
      notice: '공지사항',
      event: '이벤트',
      general: '일반',
      tournament_rules: '대회규칙',
      tournament_info: '대회요강',
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

  // 마크다운에서 이미지 url 추출 함수
  function extractImageUrls(markdown: string): string[] {
    const regex = /!\[.*?\]\((.*?)\)/g;
    const urls: string[] = [];
    let match;
    while ((match = regex.exec(markdown)) !== null) {
      urls.push(match[1]);
    }
    return urls;
  }

  const imageUrls = post ? extractImageUrls(post.content) : [];

  // 이미지 클릭 핸들러 (MarkdownRenderer에 prop으로 전달)
  const handleImageClick = (idx: number) => {
    setLightboxIndex(idx);
    setLightboxOpen(true);
  };

  useEffect(() => {
    console.log(post);
  }, [post]);

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
      {loading && <LoadingOverlay />}
      <div>
        {/* 헤더 */}
        {canManagePosts && (
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
        )}

        {/* 제목 */}
        <Box pb="1" className="border-b" style={{ borderBottomWidth: '2px' }}>
          <Text weight="bold" className="block mb-2 text-2xl">
            {post.title}
          </Text>
        </Box>

        {/* 메타 정보 */}

        <div className="flex flex-wrap gap-4 text-sm text-gray-600 border-b py-3">
          <span>작성자: {typeof post.author === 'string' ? post.author : post.author?.name}</span>
          <span>생성일: {formatDate(post._createdAt)}</span>
          {canManagePosts && (
            <>
              {post.updatedAt && <span>수정일: {formatDate(post.updatedAt)}</span>}
              {post.publishedAt && <span>발행일: {formatDate(post.publishedAt)}</span>}
            </>
          )}
        </div>

        {/* 내용 */}
        <div className="pt-4">
          <MarkdownRenderer content={post.content} onImageClick={handleImageClick} />
        </div>
        {/* Lightbox */}
        {lightboxOpen && (
          <Lightbox
            open={lightboxOpen}
            close={() => setLightboxOpen(false)}
            slides={imageUrls.map((url) => ({ src: url }))}
            index={lightboxIndex}
            plugins={[Zoom]}
          />
        )}

        {/* 첨부파일 */}
        {post.attachments && post.attachments.length > 0 && (
          <div className="pt-4 border-t">
            <Text weight="bold" mb="2" as="div">
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
                      <Text size="2" weight="bold" mr="2">
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

        {canManagePosts && (
          <Flex gap="3" justify="end" pt="4" className="border-t mt-4">
            <Button
              size="3"
              variant="soft"
              color={post.isPublished ? 'orange' : 'green'}
              onClick={() => handlePublish(post._id, post.isPublished)}
            >
              {post.isPublished ? '임시저장' : '발행'}
            </Button>
            <Button variant="soft" onClick={() => router.push(`/posts/${id}/edit`)} size="3">
              <Edit size={16} />
              수정
            </Button>
            <Button variant="soft" color="red" onClick={handleDelete} size="3">
              <Trash2 size={16} />
              삭제
            </Button>
          </Flex>
        )}
      </div>
    </Container>
  );
}
