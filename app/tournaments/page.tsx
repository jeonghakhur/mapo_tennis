'use client';
import { Box, Text, Button, Badge, Card } from '@radix-ui/themes';
import Container from '@/components/Container';
import { Calendar, MapPin, NotebookPen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTournaments } from '@/hooks/useTournaments';
import SkeletonCard from '@/components/SkeletonCard';

export default function TournamentsPage() {
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

  return (
    <Container>
      {isLoading ? (
        <SkeletonCard />
      ) : (
        <Box>
          {tournaments.length === 0 ? (
            <Card className="p-6 text-center">
              <Text size="3" color="gray">
                등록된 대회가 없습니다.
              </Text>
            </Card>
          ) : (
            <div className="space-y-4">
              {tournaments.map((tournament) => (
                <Card key={tournament._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="space-y-4">
                    {/* 제목과 상태 */}
                    <div className="flex items-center gap-3">
                      <Badge color={getStatusColor(tournament.status)}>
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
                          <Text>
                            {formatDate(tournament.startDate)} ~ {formatDate(tournament.endDate)}
                          </Text>
                        </div>
                        <div className="space-y-2">
                          {tournament.registrationStartDate && (
                            <Text color="gray">
                              등록시작: {formatDate(tournament.registrationStartDate)}
                            </Text>
                          )}
                          {tournament.registrationDeadline && (
                            <Text color="gray">
                              등록마감: {formatDate(tournament.registrationDeadline)}
                            </Text>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin size={16} />
                          <Text>{tournament.location}</Text>
                        </div>
                      </div>

                      {/* 액션 버튼 */}
                      <div className="btn-wrap">
                        {tournament.status === 'upcoming' && (
                          <Button
                            variant="solid"
                            color="blue"
                            size="3"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/tournaments/${tournament._id}/apply`);
                            }}
                          >
                            참가 신청
                          </Button>
                        )}
                        <Button
                          variant="soft"
                          size="3"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/tournaments/${tournament._id}`);
                          }}
                        >
                          상세보기
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Box>
      )}
      {/* 플로팅 대회 등록 버튼 */}
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
          onClick={() => router.push('/tournaments/create')}
        >
          <NotebookPen size={24} />
        </Button>
      </div>
    </Container>
  );
}
