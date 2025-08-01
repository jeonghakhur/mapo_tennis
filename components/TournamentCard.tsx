import { Flex, Badge, Text, Button } from '@radix-ui/themes';
import { Calendar, CalendarCheck, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { hasPermissionLevel } from '@/lib/authUtils';
import type { Tournament } from '@/model/tournament';
import type { User } from '@/model/user';

interface TournamentCardProps {
  tournament: Tournament;
  user?: User;
}

export default function TournamentCard({ tournament, user }: TournamentCardProps) {
  const router = useRouter();

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
    <Flex direction="column" gap="4" key={tournament._id}>
      <div className="flex items-center gap-3">
        <Badge color={getStatusColor(tournament.status)} size="2">
          {getStatusLabel(tournament.status)}
        </Badge>
        <Text size="5" weight="bold" className="block mb-2">
          {tournament.title}
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
        {hasPermissionLevel(user, 1) && (
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
    </Flex>
  );
}
