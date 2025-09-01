'use client';
import Container from '@/components/Container';
import '@radix-ui/themes/styles.css';
import { getUpcomingTournaments, getUpcomingTournamentsForAdmin } from '@/service/tournament';
import { useEffect, useState, Suspense, useCallback } from 'react';
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
  const [loading, setLoading] = useState(true);
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
  const [currentPage, setCurrentPage] = useState(1);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // 회원 레벨 4 이상인지 확인
  const canManagePosts = session?.user?.level >= 4;

  const {
    posts,
    pagination,
    isLoading: postsLoading,
  } = usePosts({
    showAll: canManagePosts,
    page: currentPage,
    limit: 10,
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
      setLoading(false);
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

  // 포스트 데이터 관리
  useEffect(() => {
    if (currentPage === 1) {
      setAllPosts(posts);
    } else {
      setAllPosts((prev) => [...prev, ...posts]);
    }
    setHasMore(currentPage < pagination.totalPages);
  }, [posts, currentPage, pagination.totalPages]);

  // 검색어 변경 시 페이지 초기화
  useEffect(() => {
    setCurrentPage(1);
    setAllPosts([]);
    setHasMore(true);
  }, [searchKeyword]);

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

  // 필터링된 포스트
  const filteredPosts =
    allPosts?.filter((post: Post) => {
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

  // 인피니트 스크롤 처리
  const handleScroll = useCallback(() => {
    if (isLoadingMore || !hasMore || searchKeyword.trim()) return;

    const scrollTop = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    // 스크롤 위치를 sessionStorage에 저장
    sessionStorage.setItem('homePageScrollPosition', scrollTop.toString());

    if (scrollTop + windowHeight >= documentHeight - 100) {
      setIsLoadingMore(true);
      setCurrentPage((prev) => prev + 1);
    }
  }, [isLoadingMore, hasMore, searchKeyword]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // 페이지 로드 시 스크롤 위치 복원
  useEffect(() => {
    const savedScrollPosition = sessionStorage.getItem('homePageScrollPosition');
    if (savedScrollPosition && !searchKeyword.trim()) {
      const scrollPosition = parseInt(savedScrollPosition, 10);
      // 다음 프레임에서 스크롤 위치 복원
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollPosition);
      });
    }
  }, [searchKeyword]);

  // 페이지 언마운트 시 스크롤 위치 저장
  useEffect(() => {
    return () => {
      const currentScrollPosition = window.scrollY;
      sessionStorage.setItem('homePageScrollPosition', currentScrollPosition.toString());
    };
  }, []);

  // 페이지 변경 시 로딩 상태 관리
  useEffect(() => {
    if (currentPage > 1) {
      setIsLoadingMore(false);
    }
  }, [posts, currentPage]);

  // 페이지 로드 시 스크롤 위치 복원
  useEffect(() => {
    const savedScrollPosition = sessionStorage.getItem('homePageScrollPosition');
    if (savedScrollPosition && !searchKeyword.trim()) {
      const scrollPosition = parseInt(savedScrollPosition, 10);
      // 다음 프레임에서 스크롤 위치 복원
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollPosition);
      });
    }
  }, [searchKeyword]);

  // 페이지 언마운트 시 스크롤 위치 저장
  useEffect(() => {
    return () => {
      const currentScrollPosition = window.scrollY;
      sessionStorage.setItem('homePageScrollPosition', currentScrollPosition.toString());
    };
  }, []);

  return (
    <Container>
      {loading ? (
        <SkeletonCard />
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
            {postsLoading ? (
              <SkeletonCard lines={6} />
            ) : searchKeyword && filteredPosts.length === 0 && filteredTournaments.length === 0 ? (
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
                })}
              </Flex>
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
