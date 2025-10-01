'use client';
import Container from '@/components/Container';
import '@radix-ui/themes/styles.css';
import { getUpcomingTournaments, getUpcomingTournamentsForAdmin } from '@/service/tournament';
import { useEffect, useState, Suspense, useMemo } from 'react';
import { Box, Text, Flex, Badge, Button } from '@radix-ui/themes';
import type { Post } from '@/model/post';
import type { Tournament } from '@/model/tournament';
import type { Comment } from '@/model/comment';
import { NotebookPen } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import SkeletonCard from '@/components/SkeletonCard';
import { hasPermissionLevel } from '@/lib/authUtils';
import { useSession } from 'next-auth/react';
import { usePosts } from '@/hooks/usePosts';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import PostLikeButton from '@/components/PostLikeButton';
import CommentButton from '@/components/CommentButton';
import CommentDialog from '@/components/CommentDialog';
import TournamentCard from '@/components/TournamentCard';
import Image from 'next/image';
import InfiniteScroll from 'react-infinite-scroll-component';
import 'yet-another-react-lightbox/styles.css';

// 카카오 SDK 타입 정의
declare global {
  interface Window {
    Kakao: {
      init: (key: string) => void;
      isInitialized: () => boolean;
      Share: {
        sendDefault: (data: Record<string, unknown>) => void;
      };
    };
  }
}

function HomePageContent() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const user = session?.user;

  // 포스트 목록 관련 상태
  const [searchKeyword, setSearchKeyword] = useState('');
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string>('');
  const [selectedPostTitle, setSelectedPostTitle] = useState<string>('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [initialComments, setInitialComments] = useState<Comment[]>([]);

  // 회원 레벨 4 이상인지 확인
  const canManagePosts = session?.user?.level >= 4;

  const {
    posts,
    isLoading: postsLoading,
    loadMore,
    hasMore,
    isLoadingMore,
  } = usePosts({
    showAll: canManagePosts,
    pageSize: 2,
  });

  // 목록 전체에서 Lightbox 상태 관리
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);

  // 카카오 SDK 초기화
  useEffect(() => {
    const initializeKakao = async () => {
      try {
        console.log('카카오 SDK 초기화 시작...');

        // API를 통해 카카오 앱 키 가져오기
        const response = await fetch('/api/kakao-config');
        const data = await response.json();
        const kakaoKey = data.kakaoAppKey;

        console.log('카카오 앱 키:', kakaoKey ? '설정됨' : '설정되지 않음');

        if (!kakaoKey) {
          console.warn('카카오 앱 키가 설정되지 않았습니다.');
          return;
        }

        // 카카오 SDK가 이미 로드되어 있는지 확인
        if (window.Kakao) {
          console.log('카카오 SDK 이미 로드됨');
          if (!window.Kakao.isInitialized()) {
            console.log('카카오 SDK 초기화 중...');
            window.Kakao.init(kakaoKey);
            console.log('카카오 SDK 초기화 완료');
          } else {
            console.log('카카오 SDK 이미 초기화됨');
          }
        } else {
          console.log('카카오 SDK 로드 시작...');
          // 카카오 SDK 로드
          const script = document.createElement('script');
          script.src = 'https://developers.kakao.com/sdk/js/kakao.js';
          script.onload = () => {
            console.log('카카오 SDK 스크립트 로드 완료');
            if (window.Kakao && !window.Kakao.isInitialized()) {
              console.log('카카오 SDK 초기화 중...');
              window.Kakao.init(kakaoKey);
              console.log('카카오 SDK 초기화 완료');
            }
          };
          script.onerror = () => {
            console.error('카카오 SDK 스크립트 로드 실패');
          };
          document.head.appendChild(script);
        }
      } catch (error) {
        console.error('카카오 설정 로드 실패:', error);
      }
    };

    initializeKakao();
  }, []);

  // 카카오 공유하기 함수
  const handleKakaoShare = () => {
    console.log('카카오 공유하기 버튼 클릭됨');
    console.log('window.Kakao 존재 여부:', !!window.Kakao);

    if (!window.Kakao) {
      console.error('카카오 SDK가 로드되지 않았습니다.');
      alert('카카오 SDK가 로드되지 않았습니다. 페이지를 새로고침해주세요.');
      return;
    }

    console.log('카카오 SDK 초기화 상태:', window.Kakao.isInitialized());

    const shareData = {
      objectType: 'feed',
      content: {
        title: '마포구 테니스 협회',
        description:
          '마포구 테니스 협회 공식 웹사이트입니다. 대회 정보, 클럽 관리, 소식 등을 확인하세요.',
        imageUrl: 'https://mapo-tennis.com/icon_512x512.png', // 800x400 사이즈 권장
        link: {
          mobileWebUrl: window.location.href,
          webUrl: window.location.href,
        },
      },
      social: {
        likeCount: 0,
        commentCount: 0,
        sharedCount: 0,
      },
      buttons: [
        {
          title: '웹사이트 보기',
          link: {
            mobileWebUrl: window.location.href,
            webUrl: window.location.href,
          },
        },
      ],
    };

    console.log('공유 데이터:', shareData);

    try {
      window.Kakao.Share.sendDefault(shareData);
      console.log('카카오 공유 요청 완료');
    } catch (error) {
      console.error('카카오 공유 실패:', error);
      alert('카카오 공유에 실패했습니다. 다시 시도해주세요.');
    }
  };

  useEffect(() => {
    (async () => {
      // 관리자(레벨 4 이상)는 임시저장 대회도 볼 수 있음
      const isAdmin = hasPermissionLevel(session?.user, 5);
      const tournamentResult = isAdmin
        ? await getUpcomingTournamentsForAdmin()
        : await getUpcomingTournaments();
      setTournaments(tournamentResult);
    })();
  }, [session?.user]);

  // URL 파라미터에서 검색어 가져오기
  useEffect(() => {
    try {
      const searchParam = searchParams.get('search');
      setSearchKeyword(searchParam || '');
    } catch (error) {
      console.error('검색 파라미터 처리 중 오류:', error);
      setSearchKeyword('');
    }
  }, [searchParams]);

  // 무한 스크롤 핸들러
  const handleLoadMore = () => {
    if (!searchKeyword && hasMore && !isLoadingMore) {
      loadMore();
    }
  };

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

  const handleCommnetCreated = (created: Comment) => {
    setInitialComments((prev) => [created, ...prev]);
  };

  const handleCommnetDeleted = (deletedId: string) => {
    setInitialComments((prev) => prev.filter((comment) => comment._id !== deletedId));
  };

  // 필터링된 포스트 (중복 제거 포함)
  const filteredPosts = useMemo(() => {
    if (!posts) return [];

    // 중복 제거 (같은 _id를 가진 포스트 중 첫 번째만 유지)
    const uniquePosts = posts.reduce((acc: Post[], post: Post) => {
      const existingPost = acc.find((p) => p._id === post._id);
      if (!existingPost) {
        acc.push(post);
      }
      return acc;
    }, []);

    return uniquePosts.filter((post: Post) => {
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
    });
  }, [posts, session?.user, searchKeyword]);

  // 필터링된 대회
  const filteredTournaments = tournaments.filter((tournament) => {
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase();
      const titleMatch = tournament.title.toLowerCase().includes(keyword);
      const locationMatch = tournament.location.toLowerCase().includes(keyword);
      return titleMatch || locationMatch;
    }
    return true;
  });

  return (
    <Container>
      {postsLoading ? (
        <Box className="text-center py-8">
          <div className="flex justify-center items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <Text size="4" color="gray">
              포스트를 불러오는 중...
            </Text>
          </div>
        </Box>
      ) : (
        <>
          {/* 대회 섹션 - 검색어가 없을 때만 예정 대회 표시 */}
          {!searchKeyword && filteredTournaments.length > 0 && (
            <div className="space-y-4" style={{ marginBottom: 32 }}>
              {filteredTournaments.map((tournament) => (
                <TournamentCard key={tournament._id} tournament={tournament} user={user} />
              ))}
            </div>
          )}

          {/* 검색 결과에 포함된 대회 표시 */}
          {searchKeyword && filteredTournaments.length > 0 && (
            <div className="space-y-4" style={{ marginBottom: 32 }}>
              <Text size="4" weight="bold" className="mb-4">
                대회 검색 결과
              </Text>
              {filteredTournaments.map((tournament) => (
                <TournamentCard key={tournament._id} tournament={tournament} user={user} />
              ))}
            </div>
          )}

          {/* 포스트 섹션 */}
          <div className="space-y-4">
            {/* 포스트 목록 */}
            {searchKeyword && filteredPosts.length > 0 && (
              <Text size="4" weight="bold" className="mb-4">
                포스트 검색 결과
              </Text>
            )}
            {searchKeyword && filteredPosts.length === 0 && filteredTournaments.length === 0 ? (
              <Box className="text-center py-8">
                <Text size="4" color="gray">
                  검색 결과가 없습니다.
                </Text>
              </Box>
            ) : !searchKeyword && filteredPosts.length === 0 ? (
              <Box className="text-center py-8">
                <Text size="4" color="gray">
                  포스트가 없습니다.
                </Text>
              </Box>
            ) : (
              <InfiniteScroll
                dataLength={filteredPosts.length}
                next={handleLoadMore}
                hasMore={!searchKeyword && hasMore}
                loader={null}
                endMessage={
                  !searchKeyword && posts.length > 0 ? (
                    <Box className="text-center py-4">
                      <Text size="3" color="gray">
                        모든 포스트를 불러왔습니다.
                      </Text>
                    </Box>
                  ) : null
                }
                scrollThreshold={0.5}
                style={{ overflow: 'visible' }}
              >
                <Flex direction="column" gap="4">
                  {filteredPosts.map((post: Post) => {
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
                          <MarkdownRenderer
                            content={post.content}
                            onImageClick={handleImageClick}
                          />
                        </Box>
                        {/* 첨부파일(있다면) */}
                        {post.attachments && post.attachments.length > 0 && (
                          <Box mt="4">
                            <Text weight="bold" mb="2" as="div">
                              첨부파일
                            </Text>
                            <Flex gap="2" wrap="wrap">
                              {post.attachments.map((attachment, idx) => {
                                // 파일명과 확장자 분리
                                const lastDotIndex = attachment.filename.lastIndexOf('.');
                                const filename =
                                  lastDotIndex > 0
                                    ? attachment.filename.substring(0, lastDotIndex)
                                    : attachment.filename;
                                const extension =
                                  lastDotIndex > 0
                                    ? attachment.filename.substring(lastDotIndex)
                                    : '';

                                return (
                                  <Button
                                    key={idx}
                                    size="2"
                                    variant="soft"
                                    onClick={() => {
                                      // 문서 형태의 파일 확장자들 (PDF와 이미지 제외)
                                      const documentExtensions = [
                                        '.hwp',
                                        '.hwpx',
                                        '.doc',
                                        '.docx',
                                        '.xls',
                                        '.xlsx',
                                      ];

                                      const isDocumentFile = documentExtensions.includes(
                                        extension.toLowerCase(),
                                      );

                                      if (isDocumentFile) {
                                        // 문서 파일인 경우 다운로드
                                        const link = document.createElement('a');
                                        link.href = attachment.url;
                                        link.download = attachment.filename;
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                      } else {
                                        // PDF와 이미지는 새 창에서 열기
                                        window.open(attachment.url, '_blank');
                                      }
                                    }}
                                    style={{
                                      maxWidth: '300px',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      display: 'flex',
                                      alignItems: 'center',
                                    }}
                                    title={attachment.filename}
                                  >
                                    <span
                                      style={{
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        flex: 1,
                                      }}
                                    >
                                      {filename}
                                    </span>
                                    {extension && (
                                      <span
                                        style={{
                                          flexShrink: 0,
                                          marginLeft: '2px',
                                        }}
                                      >
                                        {extension}
                                      </span>
                                    )}
                                  </Button>
                                );
                              })}
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
                              commentCount={initialComments.length || post.commentCount || 0}
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
                  })}
                </Flex>
              </InfiniteScroll>
            )}
          </div>

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
              onCommentCreated={handleCommnetCreated}
              onCommentDeleted={handleCommnetDeleted}
            />
          )}

          {/* 플로팅 버튼들 - 동적 위치 */}
          <div
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              width: '60px',
              alignItems: 'center',
            }}
          >
            {/* 카카오 공유하기 버튼 */}
            <Button
              onClick={handleKakaoShare}
              variant="ghost"
              style={{
                borderRadius: '50%',
                width: '60px',
                height: '60px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0',
                backgroundColor: '#000',
              }}
            >
              <Image
                src="/images/icon_kakao_talk.png"
                alt="카카오톡 공유하기"
                width={40}
                height={1}
                className="rounded-full"
              />
            </Button>
            {/* 플로팅 새 포스트 작성 버튼 */}
            {canManagePosts && (
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
            )}
          </div>
        </>
      )}
    </Container>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<SkeletonCard />}>
      <HomePageContent />
    </Suspense>
  );
}
