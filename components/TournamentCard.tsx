import { Flex, Badge, Text, Button } from '@radix-ui/themes';
import { Calendar, CalendarCheck, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { hasPermissionLevel } from '@/lib/authUtils';
import { useState } from 'react';
import ConfirmDialog from './ConfirmDialog';
import type { Tournament } from '@/model/tournament';
import type { User } from '@/model/user';

interface TournamentCardProps {
  tournament: Tournament;
  user?: User;
}

export default function TournamentCard({ tournament, user }: TournamentCardProps) {
  const router = useRouter();
  const [showPeriodDialog, setShowPeriodDialog] = useState(false);

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
  const isRegistrationPeriod = () => {
    if (!tournament.registrationStartDate || !tournament.registrationDeadline) {
      return false;
    }

    const now = new Date();
    const startDate = new Date(tournament.registrationStartDate);
    const endDate = new Date(tournament.registrationDeadline);

    // 시작일을 00:00:00 기준으로 설정
    startDate.setHours(0, 0, 0, 0);

    // 마감일을 23:59:59 기준으로 설정 (해당 날짜 마지막까지)
    endDate.setHours(23, 59, 59, 999);

    return now >= startDate && now <= endDate;
  };

  // 참가 신청 기간이 시작되었는지 확인
  const isRegistrationStarted = () => {
    if (!tournament.registrationStartDate) {
      return false;
    }

    const now = new Date();
    const startDate = new Date(tournament.registrationStartDate);

    // 시작일을 00:00:00 기준으로 설정
    startDate.setHours(0, 0, 0, 0);

    return now >= startDate;
  };

  // 참가 신청 기간이 종료되었는지 확인
  const isRegistrationEnded = () => {
    if (!tournament.registrationDeadline) {
      return false;
    }

    const now = new Date();
    const endDate = new Date(tournament.registrationDeadline);

    // 마감일을 23:59:59 기준으로 설정 (해당 날짜 마지막까지)
    endDate.setHours(23, 59, 59, 999);

    return now > endDate;
  };

  // 참가 신청 버튼 클릭 핸들러
  const handleApplyClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isRegistrationPeriod()) {
      setShowPeriodDialog(true);
      return;
    }

    router.push(`/tournaments/${tournament._id}/apply`);
  };

  // 참가 신청 버튼 텍스트 결정
  const getApplyButtonText = () => {
    if (!tournament.registrationStartDate) {
      return '참가 신청';
    }

    if (!isRegistrationStarted()) {
      return '참가 신청 대기';
    }

    if (isRegistrationEnded()) {
      return '참가 신청 마감';
    }

    return '참가 신청';
  };

  return (
    <Flex direction="column" gap="4" key={tournament._id}>
      <div className="flex items-center gap-3">
        <Badge color={getStatusColor(tournament.status)} size="2">
          {getStatusLabel(tournament.status)}
        </Badge>
        {tournament.isDraft && (
          <Badge color="orange" size="2">
            임시저장
          </Badge>
        )}
        <Text size="5" weight="bold" className="block mb-2">
          {tournament.title} - {getTournamentTypeLabel(tournament.tournamentType)}
        </Text>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Calendar size={16} />
          <Text>
            대회기간: {formatDate(tournament.startDate)} ~ {formatDate(tournament.endDate)}
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <CalendarCheck size={16} />
          {tournament.registrationStartDate && (
            <Text>
              참가신청: {formatDate(tournament.registrationStartDate)} ~{' '}
              {tournament.registrationDeadline && formatDate(tournament.registrationDeadline)}
            </Text>
          )}
        </div>
        <div className="flex items-center gap-2">
          <MapPin size={16} />
          장소: <Text>{tournament.location}</Text>
        </div>
      </div>
      <div className="btn-wrap">
        {hasPermissionLevel(user, 1) && tournament.status === 'upcoming' && (
          <Button variant="solid" color="blue" size="3" onClick={handleApplyClick}>
            {getApplyButtonText()}
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

      {/* 참가 신청 기간 안내 다이얼로그 */}
      <ConfirmDialog
        title="참가 신청 기간 안내"
        description={
          !tournament.registrationStartDate
            ? '이 대회는 참가 신청 기간이 설정되지 않았습니다.'
            : !isRegistrationStarted()
              ? `참가 신청은 ${formatDate(tournament.registrationStartDate)}부터 시작됩니다.`
              : isRegistrationEnded()
                ? `참가 신청은 ${tournament.registrationDeadline ? formatDate(tournament.registrationDeadline) : '설정된 날짜'}에 마감되었습니다.`
                : '참가 신청 기간이 아닙니다.'
        }
        confirmText="확인"
        confirmColor="blue"
        open={showPeriodDialog}
        onOpenChange={setShowPeriodDialog}
        onConfirm={() => setShowPeriodDialog(false)}
      />
    </Flex>
  );
}
