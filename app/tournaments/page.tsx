'use client';
import { Box, Text, Button, Flex, Badge, Card, Select } from '@radix-ui/themes';
import Container from '@/components/Container';
import { Plus, Calendar, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTournaments } from '@/hooks/useTournaments';
import SkeletonCard from '@/components/SkeletonCard';

export default function TournamentsPage() {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const router = useRouter();
  const { tournaments, isLoading, error } = useTournaments();

  if (error) {
    return (
      <Container>
        <Box>
          <Text color="red">대회 목록을 불러올 수 없습니다.</Text>
        </Box>
      </Container>
    );
  }

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

  const filteredTournaments = tournaments.filter((tournament) => {
    if (filterStatus === 'all') return true;
    return tournament.status === filterStatus;
  });

  return (
    <Container>
      {isLoading ? (
        <SkeletonCard />
      ) : (
        <Box>
          <Flex align="center" justify="between" mb="6">
            <Text size="6" weight="bold">
              테니스 대회 일정
            </Text>
            <Button onClick={() => router.push('/tournaments/create')} size="3">
              <Plus size={16} />
              대회 등록
            </Button>
          </Flex>

          <Flex gap="3" mb="4" align="center">
            <Text size="2" weight="bold">
              상태 필터:
            </Text>
            <Select.Root value={filterStatus} onValueChange={setFilterStatus}>
              <Select.Trigger placeholder="전체" />
              <Select.Content>
                <Select.Item value="all">전체</Select.Item>
                <Select.Item value="upcoming">예정</Select.Item>
                <Select.Item value="ongoing">진행중</Select.Item>
                <Select.Item value="completed">완료</Select.Item>
                <Select.Item value="cancelled">취소</Select.Item>
              </Select.Content>
            </Select.Root>
          </Flex>

          {filteredTournaments.length === 0 ? (
            <Card className="p-6 text-center">
              <Text size="3" color="gray">
                등록된 대회가 없습니다.
              </Text>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredTournaments.map((tournament) => (
                <Card
                  key={tournament._id}
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => router.push(`/tournaments/${tournament._id}`)}
                >
                  <div className="space-y-4">
                    {/* 제목과 상태 */}
                    <div className="flex items-center gap-3">
                      <Badge color={getStatusColor(tournament.status)} size="2">
                        {getStatusLabel(tournament.status)}
                      </Badge>
                      <Text size="5" weight="bold" className="block mb-2">
                        {tournament.title}
                      </Text>
                    </div>

                    {/* 정보 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} />
                          <Text size="2">
                            {formatDate(tournament.startDate)} ~ {formatDate(tournament.endDate)}
                          </Text>
                        </div>
                        <div className="space-y-2">
                          {tournament.registrationStartDate && (
                            <Text size="2" color="gray">
                              등록시작: {formatDate(tournament.registrationStartDate)}
                            </Text>
                          )}
                          {tournament.registrationDeadline && (
                            <Text size="2" color="gray">
                              등록마감: {formatDate(tournament.registrationDeadline)}
                            </Text>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin size={16} />
                          <Text size="2">{tournament.location}</Text>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Box>
      )}
    </Container>
  );
}
