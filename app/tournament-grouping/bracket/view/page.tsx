'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { Box, Text, Button, Flex, Card, Heading, Badge } from '@radix-ui/themes';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLoading } from '@/hooks/useLoading';
import { useTournament } from '@/hooks/useTournaments';
import Container from '@/components/Container';
import LoadingOverlay from '@/components/LoadingOverlay';

interface BracketMatch {
  _key: string;
  _id: string;
  round: 'round32' | 'round16' | 'quarterfinal' | 'semifinal' | 'final';
  matchNumber: number;
  team1: {
    teamId: string;
    teamName: string;
    score?: number;
  };
  team2: {
    teamId: string;
    teamName: string;
    score?: number;
  };
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  court?: string;
  winner?: string;
}

function TournamentBracketViewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { withLoading } = useLoading();

  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [bracketMatches, setBracketMatches] = useState<BracketMatch[]>([]);

  // SWR 훅 사용
  const { tournament } = useTournament(selectedTournament || '');
  const [loading, setLoading] = useState(true);

  // 부서 이름 매핑
  const divisionNameMap: Record<string, string> = {
    master: '마스터부',
    challenger: '챌린저부',
    futures: '퓨처스부',
    forsythia: '개나리부',
    chrysanthemum: '국화부',
  };

  // 라운드 이름 매핑
  const roundNameMap: Record<string, string> = {
    round32: '32강',
    round16: '16강',
    quarterfinal: '8강',
    semifinal: '4강',
    final: '결승',
  };

  // URL 파라미터에서 대회 ID와 부서 가져오기
  useEffect(() => {
    const tournamentId = searchParams.get('tournamentId');
    const division = searchParams.get('division');

    if (tournamentId && division) {
      setSelectedTournament(tournamentId);
      setSelectedDivision(division);
    }
  }, [searchParams]);

  // 본선 대진표 조회
  const fetchBracket = useCallback(
    async (tournamentId: string, division: string) => {
      if (!tournamentId || !division) return;

      return withLoading(async () => {
        const res = await fetch(
          `/api/tournament-grouping/bracket?tournamentId=${tournamentId}&division=${division}`,
        );
        if (!res.ok) return;
        const data = await res.json();
        setLoading(false);
        setBracketMatches(data.matches || []);
      });
    },
    [withLoading],
  ); // ✅ 상태 의존성 제거

  // 2) effect에서 현재 상태 값으로 호출
  useEffect(() => {
    if (!selectedTournament || !selectedDivision) return;
    fetchBracket(selectedTournament, selectedDivision);
  }, [selectedTournament, selectedDivision, fetchBracket]);

  // 특정 라운드 페이지로 이동
  const handleRoundView = (round: string) => {
    router.push(
      `/tournament-grouping/bracket/view/${round}?tournamentId=${selectedTournament}&division=${selectedDivision}`,
    );
  };

  // 라운드별로 경기 그룹화
  const matchesByRound = bracketMatches.reduce(
    (acc, match) => {
      if (!acc[match.round]) {
        acc[match.round] = [];
      }
      acc[match.round].push(match);
      return acc;
    },
    {} as Record<string, BracketMatch[]>,
  );

  // 라운드 순서 정의
  const roundOrder = ['round32', 'round16', 'quarterfinal', 'semifinal', 'final'];

  return (
    <Container>
      {loading && <LoadingOverlay />}
      {/* 본선 대진표 표시 */}
      {bracketMatches.length > 0 && (
        <Box>
          <Heading size="5" weight="bold" mb="4">
            본선 대진표
          </Heading>

          {/* 라운드별로 경기 표시 */}
          {roundOrder.map((round) => {
            const roundMatches = matchesByRound[round];
            if (!roundMatches || roundMatches.length === 0) return null;

            return (
              <Box key={round} mb="6">
                <Flex align="center" justify="between" mb="3">
                  <Heading size="4" weight="bold">
                    {roundNameMap[round]}
                  </Heading>
                  <Button size="2" variant="soft" onClick={() => handleRoundView(round)}>
                    {roundNameMap[round]} 상세보기
                  </Button>
                </Flex>

                <Flex direction="column" gap="3">
                  {roundMatches
                    .sort((a, b) => a.matchNumber - b.matchNumber)
                    .map((match) => (
                      <Card key={match._key}>
                        <Box p="4">
                          <Flex align="center" justify="between" mb="2">
                            <Text size="2" color="gray">
                              {match.matchNumber}경기
                            </Text>
                            <Badge
                              color={
                                match.status === 'completed'
                                  ? 'green'
                                  : match.status === 'in_progress'
                                    ? 'orange'
                                    : 'gray'
                              }
                              size="2"
                            >
                              {match.status === 'completed' && '완료'}
                              {match.status === 'in_progress' && '진행중'}
                              {match.status === 'scheduled' && '예정'}
                              {match.status === 'cancelled' && '취소'}
                            </Badge>
                          </Flex>

                          <Flex direction="column" gap="2">
                            <Flex align="center" justify="between">
                              <Text weight="bold" style={{ wordBreak: 'break-word', flex: '1' }}>
                                {match.team1.teamName}
                              </Text>
                              <Text
                                size="4"
                                weight="bold"
                                style={{ minWidth: '40px', textAlign: 'center' }}
                              >
                                {match.team1.score !== undefined ? match.team1.score : '-'}
                              </Text>
                            </Flex>
                            <Flex align="center" justify="between">
                              <Text weight="bold" style={{ wordBreak: 'break-word', flex: '1' }}>
                                {match.team2.teamName}
                              </Text>
                              <Text
                                size="4"
                                weight="bold"
                                style={{ minWidth: '40px', textAlign: 'center' }}
                              >
                                {match.team2.score !== undefined ? match.team2.score : '-'}
                              </Text>
                            </Flex>
                          </Flex>

                          {match.court && (
                            <Text size="2" color="gray" mt="2">
                              코트: {match.court}
                            </Text>
                          )}
                        </Box>
                      </Card>
                    ))}
                </Flex>
              </Box>
            );
          })}
        </Box>
      )}
    </Container>
  );
}

export default function TournamentBracketViewPage() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <TournamentBracketViewContent />
    </Suspense>
  );
}
