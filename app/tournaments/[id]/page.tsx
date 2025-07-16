'use client';
import { Box, Text, Button, Flex, Badge, Card } from '@radix-ui/themes';
import Container from '@/components/Container';
import { ArrowLeft, Edit, Trash2, Calendar, MapPin, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { useTournament, useDeleteTournament } from '@/hooks/useTournaments';
import { usePost } from '@/hooks/usePosts';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import SkeletonCard from '@/components/SkeletonCard';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useState, useCallback, useEffect } from 'react';
import LoadingOverlay from '@/components/LoadingOverlay';
import { useLoading } from '@/hooks/useLoading';
import { mutate } from 'swr';
import { Tournament } from '@/model/tournament';

interface TournamentDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function TournamentDetailPage({ params }: TournamentDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { tournament, isLoading, error } = useTournament(id);
  const [contentLoaded, setContentLoaded] = useState(false);
  const { trigger: deleteTournament, isMutating: isDeleting } = useDeleteTournament(id);
  const { loading, withLoading } = useLoading();
  // 포스트 데이터 가져오기
  const { post: descriptionPost, isLoading: isLoadingDescription } = usePost(
    tournament?.descriptionPostId || '',
  );
  const { post: rulesPost, isLoading: isLoadingRules } = usePost(tournament?.rulesPostId || '');

  // 모든 콘텐츠 로딩 상태 확인
  const isAllContentLoaded = useCallback(() => {
    if (isLoading) return false;
    if (!tournament) return false;

    // 설명 포스트가 있는 경우 로딩 완료 확인
    if (tournament.descriptionPostId && isLoadingDescription) return false;

    // 규칙 포스트가 있는 경우 로딩 완료 확인
    if (tournament.rulesPostId && isLoadingRules) return false;

    return true;
  }, [isLoading, tournament, isLoadingDescription, isLoadingRules]);

  // 콘텐츠 로딩 상태 업데이트
  useEffect(() => {
    if (isAllContentLoaded()) {
      setContentLoaded(true);
    }
  }, [isAllContentLoaded]);

  if (error) {
    return (
      <Container>
        <Box>
          <Text color="red">대회를 불러올 수 없습니다.</Text>
        </Box>
      </Container>
    );
  }

  // 로딩이 완료되었고 에러가 없는데 대회가 없는 경우
  if (!isLoading && !error && !tournament) {
    return (
      <Container>
        <Box>
          <Text>대회를 찾을 수 없습니다.</Text>
        </Box>
      </Container>
    );
  }

  if (!tournament) {
    return null;
  }

  const handleDelete = async () => {
    if (!tournament) return;

    try {
      await withLoading(() => deleteTournament());
      mutate(
        '/api/tournaments',
        (current: Tournament[] = []) => {
          return current.filter((t) => t._id !== id);
        },
        false,
      );
      router.push('/tournaments');
    } catch (error) {
      console.error('대회 삭제 실패:', error);
      alert('대회 삭제 중 오류가 발생했습니다.');
    }
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, 'red' | 'blue' | 'green' | 'gray'> = {
      upcoming: 'blue',
      ongoing: 'green',
      completed: 'gray',
      cancelled: 'red',
    };
    return colorMap[status] || 'gray';
  };

  const getStatusLabel = (status: string) => {
    const labelMap: Record<string, string> = {
      upcoming: '예정',
      ongoing: '진행중',
      completed: '완료',
      cancelled: '취소',
    };
    return labelMap[status] || status;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Container>
      {isLoading || !contentLoaded ? (
        <SkeletonCard />
      ) : (
        <Box>
          {loading && <LoadingOverlay size="3" />}
          <Flex align="center" gap="3" mb="6">
            <Button variant="soft" onClick={() => router.back()} size="2">
              <ArrowLeft size={16} />
              뒤로가기
            </Button>
            <Text size="6" weight="bold">
              대회 상세
            </Text>
          </Flex>

          <Card className="p-6">
            <div className="space-y-6">
              {/* 헤더 */}
              <div className="flex items-center gap-2 mb-4">
                <Badge color={getStatusColor(tournament.status)} size="2">
                  {getStatusLabel(tournament.status)}
                </Badge>
              </div>

              {/* 제목 */}
              <div>
                <Text size="6" weight="bold" className="block mb-2">
                  {tournament.title}
                </Text>
              </div>

              {/* 기본 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Text size="4" weight="bold" className="block">
                    기본 정보
                  </Text>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} />
                      <div>
                        <Text size="2" weight="bold">
                          대회 기간
                        </Text>
                        <Text size="2" color="gray">
                          {formatDate(tournament.startDate)} ~ {formatDate(tournament.endDate)}
                        </Text>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin size={16} />
                      <div>
                        <Text size="2" weight="bold">
                          장소
                        </Text>
                        <Text size="2" color="gray">
                          {tournament.location}
                        </Text>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users size={16} />
                      <div>
                        <Text size="2" weight="bold">
                          참가자
                        </Text>
                        <Text size="2" color="gray">
                          {tournament.currentParticipants || 0} 명
                        </Text>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Text size="4" weight="bold" className="block">
                    대회 정보
                  </Text>

                  <div className="space-y-3">
                    {tournament.registrationStartDate && (
                      <div>
                        <Text size="2" weight="bold">
                          등록 시작일
                        </Text>
                        <Text size="2" color="gray">
                          {formatDate(tournament.registrationStartDate)}
                        </Text>
                      </div>
                    )}
                    {tournament.registrationDeadline && (
                      <div>
                        <Text size="2" weight="bold">
                          등록 마감일
                        </Text>
                        <Text size="2" color="gray">
                          {formatDate(tournament.registrationDeadline)}
                        </Text>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 대회 설명 포스트 내용 */}
              {tournament.descriptionPostId && (
                <div className="pt-4 border-t">
                  <Text size="4" weight="bold" className="block mb-3">
                    대회 설명
                  </Text>
                  {descriptionPost ? (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <MarkdownRenderer content={descriptionPost.content} />
                    </div>
                  ) : (
                    <Text size="2" color="gray">
                      대회 설명을 찾을 수 없습니다.
                    </Text>
                  )}
                </div>
              )}

              {/* 대회 규칙 포스트 내용 */}
              {tournament.rulesPostId && (
                <div className="pt-4 border-t">
                  <Text size="4" weight="bold" className="block mb-3">
                    대회 규칙
                  </Text>
                  {rulesPost ? (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <MarkdownRenderer content={rulesPost.content} />
                    </div>
                  ) : (
                    <Text size="2" color="gray">
                      대회 규칙을 찾을 수 없습니다.
                    </Text>
                  )}
                </div>
              )}

              {/* 액션 버튼 */}
              <Flex gap="3" justify="end" pt="6" className="border-t">
                <Button
                  variant="soft"
                  onClick={() => router.push(`/tournaments/${id}/edit`)}
                  size="3"
                  disabled={isDeleting}
                >
                  <Edit size={16} />
                  수정
                </Button>
                <ConfirmDialog
                  title="대회 삭제"
                  description={`"${tournament.title}" 대회를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
                  confirmText="삭제"
                  cancelText="취소"
                  confirmColor="red"
                  onConfirm={handleDelete}
                  disabled={isDeleting}
                  trigger={
                    <Button variant="soft" color="red" size="3" disabled={isDeleting}>
                      <Trash2 size={16} />
                      {isDeleting ? '삭제 중...' : '삭제'}
                    </Button>
                  }
                />
              </Flex>
            </div>
          </Card>
        </Box>
      )}
    </Container>
  );
}
