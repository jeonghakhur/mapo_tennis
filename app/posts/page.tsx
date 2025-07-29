'use client';
import { Box, Text, Button, Badge, TextField, Flex } from '@radix-ui/themes';
import Container from '@/components/Container';
import { Search, NotebookPen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { usePosts } from '@/hooks/usePosts';
import type { Post } from '@/model/post';
import type { Comment } from '@/model/comment';
import SkeletonCard from '@/components/SkeletonCard';
import { hasPermissionLevel } from '@/lib/authUtils';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import PostLikeButton from '@/components/PostLikeButton';
import CommentButton from '@/components/CommentButton';
import CommentDialog from '@/components/CommentDialog';
// import { useScrollRestoration } from '@/hooks/useScrollRestoration';
import 'yet-another-react-lightbox/styles.css';

export default function PostsPage() {
  const { data: session } = useSession();
  const [searchKeyword, setSearchKeyword] = useState('');
  const { posts, isLoading } = usePosts();
  const router = useRouter();
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string>('');
  const [selectedPostTitle, setSelectedPostTitle] = useState<string>('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [initialComments, setInitialComments] = useState<Comment[]>([]);
  // useScrollRestoration('posts');

  // 회원 레벨 4 이상인지 확인
  const canManagePosts = session?.user?.level >= 4;

  // 필터링된 포스트
  const filteredPosts =
    posts?.filter((post: Post) => {
      // 회원 레벨 4 미만은 발행된 포스트만 볼 수 있음
      if (!hasPermissionLevel(session?.user, 4) && !post.isPublished) {
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

  // 목록 전체에서 Lightbox 상태 관리
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);

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

  // 상대적 시간 포맷 함수
  function formatRelativeTime(dateString: string) {
    const now = new Date();
    const date = new Date(dateString);
    const diff = (now.getTime() - date.getTime()) / 1000; // 초 단위
    if (diff < 60) return '방금 전';
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`;
    if (diff < 2419200) return `${Math.floor(diff / 604800)}주 전`;
    return date.toLocaleDateString('ko-KR');
  }

  // 코멘트 다이얼로그 열기
  const handleCommentClick = async (postId: string, postTitle: string) => {
    setSelectedPostId(postId);
    setSelectedPostTitle(postTitle);
    setIsLoadingComments(true);

    // 코멘트를 먼저 가져온 후 다이얼로그 열기
    try {
      const response = await fetch(`/api/comments?postId=${postId}`);
      if (response.ok) {
        const data = await response.json();
        setInitialComments(data.comments || []);
        setCommentDialogOpen(true);
      } else {
        alert('코멘트를 불러오는 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('코멘트 조회 오류:', error);
      alert('코멘트를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoadingComments(false);
    }
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

          <Flex direction="column" gap="4">
            {filteredPosts.length === 0 ? (
              <Box className="text-center py-8">
                <Text size="4" color="gray">
                  {searchKeyword ? '검색 결과가 없습니다.' : '포스트가 없습니다.'}
                </Text>
              </Box>
            ) : (
              filteredPosts.map((post: Post) => {
                const imageUrls = extractImageUrls(post.content);
                // 이미지 클릭 핸들러
                const handleImageClick = (idx: number) => {
                  setLightboxImages(imageUrls);
                  setLightboxIndex(idx);
                  setLightboxOpen(true);
                };
                return (
                  <Box key={post._id} className="border-b pb-4">
                    <Flex align="center" gap="2" mb="1">
                      <Text weight="bold" size="4">
                        {post.title}
                      </Text>
                      <Text size="2" color="gray">
                        {formatRelativeTime(post.createdAt)}
                      </Text>
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
                    </Flex>
                    {/* 본문 전체 */}
                    <Box mt="4">
                      <MarkdownRenderer content={post.content} onImageClick={handleImageClick} />
                    </Box>
                    {/* 첨부파일(있다면) */}
                    {post.attachments && post.attachments.length > 0 && (
                      <Box mt="4">
                        <Text weight="bold" mb="2" as="div">
                          첨부파일
                        </Text>
                        <Flex gap="2" wrap="wrap">
                          {post.attachments.map((attachment, idx) => (
                            <Button
                              key={idx}
                              size="2"
                              variant="soft"
                              onClick={() => window.open(attachment.url, '_blank')}
                            >
                              {attachment.filename}
                            </Button>
                          ))}
                        </Flex>
                      </Box>
                    )}
                    {/* 좋아요, 코멘트 버튼과 관리자 수정 버튼 */}
                    <Flex justify="between" align="center" mt="4">
                      <Flex gap="3">
                        <PostLikeButton
                          postId={post._id}
                          initialLikeCount={post.likeCount || 0}
                          initialIsLiked={
                            post.likedBy?.some(
                              (ref: { _key: string; _ref: string }) =>
                                ref._ref === session?.user?.id,
                            ) || false
                          }
                        />
                        <CommentButton
                          commentCount={post.commentCount || 0}
                          onClick={() => handleCommentClick(post._id, post.title)}
                          isLoading={isLoadingComments && selectedPostId === post._id}
                        />
                      </Flex>
                      {hasPermissionLevel(session?.user, 4) && (
                        <Button
                          size="3"
                          variant="soft"
                          onClick={() => router.push(`/posts/${post._id}/edit`)}
                        >
                          수정
                        </Button>
                      )}
                    </Flex>
                  </Box>
                );
              })
            )}
          </Flex>

          {/* Lightbox */}
          {lightboxOpen && (
            <Lightbox
              open={lightboxOpen}
              close={() => setLightboxOpen(false)}
              slides={lightboxImages.map((url) => ({ src: url }))}
              index={lightboxIndex}
              plugins={[Zoom]}
            />
          )}

          {/* 코멘트 다이얼로그 */}
          {commentDialogOpen && (
            <CommentDialog
              postId={selectedPostId}
              postTitle={selectedPostTitle}
              open={commentDialogOpen}
              onOpenChange={setCommentDialogOpen}
              initialComments={initialComments}
            />
          )}
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
