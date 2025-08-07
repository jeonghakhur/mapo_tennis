'use client';
import { Box, Text, Button, Badge, Card } from '@radix-ui/themes';
import Container from '@/components/Container';
import { Calendar, CalendarCheck, MapPin, NotebookPen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTournamentsByUserLevel } from '@/hooks/useTournaments';
import SkeletonCard from '@/components/SkeletonCard';
import { hasPermissionLevel } from '@/lib/authUtils';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import ConfirmDialog from '@/components/ConfirmDialog';
import type { Tournament } from '@/model/tournament';

export default function TournamentsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;
  const { tournaments, isLoading, error } = useTournamentsByUserLevel(user?.level);
  const [showPeriodDialog, setShowPeriodDialog] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);

  // 관리자 권한에 따라 대회 필터링
  const filteredTournaments = tournaments.filter((tournament) => {
    // 관리자(레벨 4 이상)는 모든 대회를 볼 수 있음
    if (hasPermissionLevel(user, 4)) {
      return true;
    }
    // 일반 사용자는 개시된 대회만 볼 수 있음
    return !tournament.isDraft;
  });

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

  // 대회 타입을 한글명으로 변환
  const getTournamentTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      individual: '개인전',
      team: '단체전',
    };
    return typeMap[type] || type;
  };

  // 참가 신청 기간 확인
  const isRegistrationPeriod = (tournament: Tournament) => {
    if (!tournament.registrationStartDate || !tournament.registrationDeadline) {
      return false;
    }

    const now = new Date();
    const startDate = new Date(tournament.registrationStartDate);
    const endDate = new Date(tournament.registrationDeadline);

    return now >= startDate && now <= endDate;
  };

  // 참가 신청 기간이 시작되었는지 확인
  const isRegistrationStarted = (tournament: Tournament) => {
    if (!tournament.registrationStartDate) {
      return false;
    }

    const now = new Date();
    const startDate = new Date(tournament.registrationStartDate);

    return now >= startDate;
  };

  // 참가 신청 기간이 종료되었는지 확인
  const isRegistrationEnded = (tournament: Tournament) => {
    if (!tournament.registrationDeadline) {
      return false;
    }

    const now = new Date();
    const endDate = new Date(tournament.registrationDeadline);

    return now > endDate;
  };

  // 참가 신청 버튼 클릭 핸들러
  const handleApplyClick = (e: React.MouseEvent, tournament: Tournament) => {
    e.stopPropagation();

    if (!isRegistrationPeriod(tournament)) {
      setSelectedTournament(tournament);
      setShowPeriodDialog(true);
      return;
    }

    router.push(`/tournaments/${tournament._id}/apply`);
  };

  // 참가 신청 버튼 텍스트 결정
  const getApplyButtonText = (tournament: Tournament) => {
    if (!tournament.registrationStartDate) {
      return '참가 신청';
    }

    if (!isRegistrationStarted(tournament)) {
      return '참가 신청 대기';
    }

    if (isRegistrationEnded(tournament)) {
      return '참가 신청 마감';
    }

    return '참가 신청';
  };

  return (
    <Container>
      {isLoading ? (
        <SkeletonCard />
      ) : (
        <Box>
          {filteredTournaments.length === 0 ? (
            <Card className="p-6 text-center">
              <Text size="3" color="gray">
                등록된 대회가 없습니다.
              </Text>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredTournaments.map((tournament) => (
                <Card key={tournament._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="space-y-4">
                    {/* 제목과 상태 */}
                    <div className="flex items-center gap-3">
                      <Badge color={getStatusColor(tournament.status)}>
                        {getStatusLabel(tournament.status)}
                      </Badge>
                      {tournament.isDraft && <Badge color="orange">임시저장</Badge>}
                      <Text size="5" weight="bold" className="block mb-2">
                        {tournament.title} - {getTournamentTypeLabel(tournament.tournamentType)}
                      </Text>
                    </div>

                    {/* 정보 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} />
                          <Text>
                            대회기간: {formatDate(tournament.startDate)} ~{' '}
                            {formatDate(tournament.endDate)}
                          </Text>
                        </div>
                        <div className="flex items-center gap-2">
                          <CalendarCheck size={16} />
                          {tournament.registrationStartDate && (
                            <Text>
                              참가신청: {formatDate(tournament.registrationStartDate)} ~{' '}
                              {tournament.registrationDeadline &&
                                formatDate(tournament.registrationDeadline)}
                            </Text>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin size={16} />
                          장소: <Text>{tournament.location}</Text>
                        </div>
                      </div>

                      {/* 액션 버튼 */}
                      <div className="btn-wrap">
                        {tournament.status === 'upcoming' &&
                          hasPermissionLevel(user, 1) &&
                          !tournament.isDraft && (
                            <Button
                              variant="solid"
                              color="blue"
                              size="3"
                              onClick={(e) => handleApplyClick(e, tournament)}
                            >
                              {getApplyButtonText(tournament)}
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

      {/* 참가 신청 기간 안내 다이얼로그 */}
      {selectedTournament && (
        <ConfirmDialog
          title="참가 신청 기간 안내"
          description={
            !selectedTournament.registrationStartDate
              ? '이 대회는 참가 신청 기간이 설정되지 않았습니다.'
              : !isRegistrationStarted(selectedTournament)
                ? `참가 신청은 ${formatDate(selectedTournament.registrationStartDate)}부터 시작됩니다.`
                : isRegistrationEnded(selectedTournament)
                  ? `참가 신청은 ${selectedTournament.registrationDeadline ? formatDate(selectedTournament.registrationDeadline) : '설정된 날짜'}에 마감되었습니다.`
                  : '참가 신청 기간이 아닙니다.'
          }
          confirmText="확인"
          confirmColor="blue"
          open={showPeriodDialog}
          onOpenChange={setShowPeriodDialog}
          onConfirm={() => {
            setShowPeriodDialog(false);
            setSelectedTournament(null);
          }}
        />
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
