'use client';
import { Box, Text, Button, Flex, TextField, Select } from '@radix-ui/themes';
import Container from '@/components/Container';
import { Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { use } from 'react';
import type { TournamentFormData } from '@/model/tournament';
import { useTournament, useUpdateTournament } from '@/hooks/useTournaments';
import { usePostsByCategory } from '@/hooks/usePosts';
import { useLoading } from '@/hooks/useLoading';
import LoadingOverlay from '@/components/LoadingOverlay';
import SkeletonCard from '@/components/SkeletonCard';

interface EditTournamentPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditTournamentPage({ params }: EditTournamentPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [formData, setFormData] = useState<TournamentFormData>({
    title: '',
    startDate: '',
    endDate: '',
    location: '',
    registrationStartDate: '',
    registrationDeadline: '',
    descriptionPostId: '',
    rulesPostId: '',
  });
  const [status, setStatus] = useState<string>('upcoming');
  const { loading, withLoading } = useLoading();

  // SWR 훅 사용
  const { tournament, isLoading: isLoadingTournament, error: tournamentError } = useTournament(id);
  const { posts: schedulePosts, isLoading: isLoadingSchedulePosts } =
    usePostsByCategory('tournament_schedule');
  const { posts: infoPosts, isLoading: isLoadingInfoPosts } = usePostsByCategory('tournament_info');
  const { trigger: updateTournament, isMutating } = useUpdateTournament(id);

  // 대회 데이터가 로드되면 폼 데이터 설정
  useEffect(() => {
    if (tournament) {
      setFormData({
        title: tournament.title,
        startDate: tournament.startDate.split('T')[0],
        endDate: tournament.endDate.split('T')[0],
        location: tournament.location,
        registrationStartDate: tournament.registrationStartDate
          ? tournament.registrationStartDate.split('T')[0]
          : '',
        registrationDeadline: tournament.registrationDeadline
          ? tournament.registrationDeadline.split('T')[0]
          : '',
        descriptionPostId: tournament.descriptionPostId || '',
        rulesPostId: tournament.rulesPostId || '',
      });
      setStatus(tournament.status);
    }
  }, [tournament]);

  // 에러 처리
  if (tournamentError && !isLoadingTournament) {
    return (
      <Container>
        <Box>
          <Text color="red">대회를 불러올 수 없습니다.</Text>
        </Box>
      </Container>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await withLoading(() => updateTournament({ ...formData, status }));
      router.push(`/tournaments/${id}`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('대회 수정에 실패했습니다.');
      }
    }
  };

  const handleInputChange = (
    field: keyof TournamentFormData,
    value: string | number | undefined,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (!tournament) return null;

  return (
    <Container>
      {isLoadingTournament || isLoadingSchedulePosts || isLoadingInfoPosts ? (
        <SkeletonCard />
      ) : (
        <Box>
          {loading && <LoadingOverlay size="3" />}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 기본 정보 */}
              <div className="space-y-4">
                <Text size="4" weight="bold" className="block">
                  기본 정보
                </Text>

                <div>
                  <Text size="2" weight="bold" className="block mb-2">
                    대회명 *
                  </Text>
                  <TextField.Root
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="대회명을 입력하세요"
                    required
                  />
                </div>

                <div>
                  <Text size="2" weight="bold" className="block mb-2">
                    장소 *
                  </Text>
                  <TextField.Root
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="대회 장소를 입력하세요"
                    required
                  />
                </div>
              </div>

              {/* 날짜 및 시간 */}
              <div className="space-y-4">
                <Text size="4" weight="bold" className="block">
                  날짜 및 시간
                </Text>

                <div>
                  <Text size="2" weight="bold" className="block mb-2">
                    시작일 *
                  </Text>
                  <TextField.Root
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Text size="2" weight="bold" className="block mb-2">
                    종료일 *
                  </Text>
                  <TextField.Root
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Text size="2" weight="bold" className="block mb-2">
                    등록 시작일
                  </Text>
                  <TextField.Root
                    type="date"
                    value={formData.registrationStartDate}
                    onChange={(e) => handleInputChange('registrationStartDate', e.target.value)}
                  />
                </div>

                <div>
                  <Text size="2" weight="bold" className="block mb-2">
                    등록 마감일
                  </Text>
                  <TextField.Root
                    type="date"
                    value={formData.registrationDeadline}
                    onChange={(e) => handleInputChange('registrationDeadline', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 대회 상태 */}
              <div className="space-y-4">
                <Text size="4" weight="bold" className="block">
                  대회 상태
                </Text>

                <div>
                  <Text size="2" weight="bold" className="block mb-2">
                    진행 상태
                  </Text>
                  <Select.Root
                    value={status}
                    onValueChange={(v) => {
                      if (!v) return;
                      setStatus(v);
                    }}
                  >
                    <Select.Trigger placeholder="상태를 선택하세요" />
                    <Select.Content>
                      <Select.Item value="upcoming">예정</Select.Item>
                      <Select.Item value="ongoing">진행중</Select.Item>
                      <Select.Item value="completed">완료</Select.Item>
                      <Select.Item value="cancelled">취소</Select.Item>
                    </Select.Content>
                  </Select.Root>
                </div>
              </div>

              {/* 포스트 링크 */}
              <div className="space-y-4">
                <Text size="4" weight="bold" className="block">
                  포스트 링크
                </Text>

                <div>
                  <Text size="2" weight="bold" className="block mb-2">
                    대회 설명 포스트
                  </Text>
                  <Select.Root
                    value={formData.descriptionPostId || 'none'}
                    onValueChange={(value) =>
                      handleInputChange('descriptionPostId', value === 'none' ? '' : value)
                    }
                  >
                    <Select.Trigger placeholder="대회 설명 포스트를 선택하세요" />
                    <Select.Content>
                      <Select.Item value="none">선택하지 않음</Select.Item>
                      {schedulePosts.map((post) => (
                        <Select.Item key={post._id} value={post._id}>
                          {post.title}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                </div>

                <div>
                  <Text size="2" weight="bold" className="block mb-2">
                    대회 규칙 포스트
                  </Text>
                  <Select.Root
                    value={formData.rulesPostId || 'none'}
                    onValueChange={(value) =>
                      handleInputChange('rulesPostId', value === 'none' ? '' : value)
                    }
                  >
                    <Select.Trigger placeholder="대회 규칙 포스트를 선택하세요" />
                    <Select.Content>
                      <Select.Item value="none">선택하지 않음</Select.Item>
                      {infoPosts.map((post) => (
                        <Select.Item key={post._id} value={post._id}>
                          {post.title}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                </div>
              </div>
            </div>

            <Flex gap="3" justify="end" pt="6" className="border-t">
              <Button type="button" variant="soft" onClick={() => router.back()} size="3">
                취소
              </Button>
              <Button type="submit" disabled={isMutating} size="3">
                <Save size={16} />
                {isMutating ? '수정 중...' : '수정하기'}
              </Button>
            </Flex>
          </form>
        </Box>
      )}
    </Container>
  );
}
