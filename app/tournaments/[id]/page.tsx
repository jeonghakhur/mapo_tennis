'use client';
import { Box, Text, Button, Flex, Badge } from '@radix-ui/themes';
import Container from '@/components/Container';
import { Edit, Trash2, Calendar, MapPin } from 'lucide-react';
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
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

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
    const date = new Date(dateString);
    return format(date, 'yy.MM.dd(eee)', { locale: ko });
  };

  return (
    <Container>
      {isLoading || !contentLoaded ? (
        <SkeletonCard />
      ) : (
        <Box>
          {loading && <LoadingOverlay size="3" />}

          <div className="space-y-6">
            {/* 제목 */}
            <Flex align="center" gap="2">
              <Badge color={getStatusColor(tournament.status)}>
                {getStatusLabel(tournament.status)}
              </Badge>
              <Text size="6" weight="bold" className="block mb-2">
                {tournament.title}
              </Text>
            </Flex>

            {/* 기본 정보 */}
            <Flex direction="column" gap="4">
              <Text size="4" weight="bold" className="block">
                기본 정보
              </Text>

              <Flex align="center" gap="2">
                <Calendar size={16} />
                <Text weight="bold">대회 기간</Text>
                <Text>
                  {formatDate(tournament.startDate)} ~ {formatDate(tournament.endDate)}
                </Text>
              </Flex>
              <Flex align="center" gap="2">
                <Calendar size={16} />

                <Text weight="bold">등록 기간</Text>
                <Text>
                  {formatDate(tournament?.registrationStartDate || '')}
                  {tournament.registrationDeadline &&
                    `~ ${formatDate(tournament.registrationDeadline)}`}
                </Text>
              </Flex>

              <Flex align="center" gap="2">
                <MapPin size={16} />
                <Text weight="bold">장소</Text>
                <Text>{tournament.location}</Text>
              </Flex>
            </Flex>

            {/* 대회 설명 포스트 내용 */}
            {tournament.descriptionPostId && (
              <div className="pt-4 border-t">
                <Text size="4" weight="bold" className="block mb-3">
                  대회 정보
                </Text>
                {descriptionPost ? (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <MarkdownRenderer content={descriptionPost.content} />
                  </div>
                ) : (
                  <Text>대회 설명을 찾을 수 없습니다.</Text>
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
                  <Text>대회 규칙을 찾을 수 없습니다.</Text>
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
        </Box>
      )}
    </Container>
  );
}
