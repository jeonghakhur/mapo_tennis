'use client';
import { Box, Text, Button, Flex, TextField, Select } from '@radix-ui/themes';
import Container from '@/components/Container';
import { ArrowLeft, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { TournamentFormData } from '@/model/tournament';
import { usePostsByCategory } from '@/hooks/usePosts';
import { useCreateTournament } from '@/hooks/useTournaments';

export default function CreateTournamentPage() {
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

  const { posts: schedulePosts, isLoading: isLoadingSchedulePosts } =
    usePostsByCategory('tournament_schedule');
  const { posts: infoPosts, isLoading: isLoadingInfoPosts } = usePostsByCategory('tournament_info');

  // 대회 등록 훅
  const { trigger: createTournament, isMutating } = useCreateTournament();

  // 포스트 로딩 중일 때 처리
  if (isLoadingSchedulePosts || isLoadingInfoPosts) {
    return (
      <Container>
        <Box>
          <Text>포스트 목록을 불러오는 중...</Text>
        </Box>
      </Container>
    );
  }

  // 에러 처리
  if (schedulePosts.length === 0 && infoPosts.length === 0) {
    return (
      <Container>
        <Box>
          <Text color="red">포스트를 불러올 수 없습니다. 페이지를 새로고침해주세요.</Text>
        </Box>
      </Container>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTournament(formData);
      alert('대회가 성공적으로 등록되었습니다.');
      router.push('/tournaments');
    } catch {
      alert('대회 등록에 실패했습니다.');
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

  return (
    <Container>
      <Box>
        <Flex align="center" gap="3" mb="6">
          <Button variant="soft" onClick={() => router.back()} size="2">
            <ArrowLeft size={16} />
            뒤로가기
          </Button>
          <Text size="6" weight="bold">
            대회 등록
          </Text>
        </Flex>

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
              {isMutating ? '등록 중...' : '대회 등록'}
            </Button>
          </Flex>
        </form>
      </Box>
    </Container>
  );
}
