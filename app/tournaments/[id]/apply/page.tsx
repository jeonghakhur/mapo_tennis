'use client';
import Container from '@/components/Container';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { useTournament } from '@/hooks/useTournaments';
import SkeletonCard from '@/components/SkeletonCard';
import TournamentApplicationForm from '@/components/TournamentApplicationForm';
import { Text, Button } from '@radix-ui/themes';

interface TournamentApplyPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function TournamentApplyPage({ params }: TournamentApplyPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { tournament, isLoading, error } = useTournament(id);

  if (error) {
    return (
      <Container>
        <div>
          <p className="text-red-500">대회를 불러올 수 없습니다.</p>
        </div>
      </Container>
    );
  }

  if (!isLoading && !error && !tournament) {
    return (
      <Container>
        <div>
          <p>대회를 찾을 수 없습니다.</p>
        </div>
      </Container>
    );
  }

  if (!tournament) {
    return <SkeletonCard />;
  }

  // 대회 상태가 '예정'이 아닌 경우 참가신청 불가
  if (tournament.status !== 'upcoming') {
    return (
      <Container>
        <div className="text-center py-8">
          <Text size="4" weight="bold" color="red" className="block mb-2">
            참가신청이 불가능한 대회입니다.
          </Text>
          <Text size="3" color="gray" className="block mb-4">
            예정 상태의 대회만 참가신청이 가능합니다.
          </Text>
          <Button onClick={() => router.push(`/tournaments/${id}`)}>대회 상세로 돌아가기</Button>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <TournamentApplicationForm
        tournament={tournament}
        onCancel={() => router.push(`/tournaments/${id}`)}
      />
    </Container>
  );
}
