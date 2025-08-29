'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { Box, Text, Button, Flex, Card, Heading, Badge } from '@radix-ui/themes';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLoading } from '@/hooks/useLoading';
import { useTournament } from '@/hooks/useTournaments';
import Container from '@/components/Container';

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

  // 부서 이름 매핑
  const divisionNameMap: Record<string, string> = {
    master: '마스터부',
    challenger: '챌린저부',
    futures: '퓨처스부',
    forsythia: '개나리부',
    chrysanthemum: '국화부',
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
  const fetchBracket = useCallback(async () => {
    if (!selectedTournament || !selectedDivision) return;

    return withLoading(async () => {
      const response = await fetch(
        `/api/tournament-grouping/bracket?tournamentId=${selectedTournament}&division=${selectedDivision}`,
      );

      if (response.ok) {
        const data = await response.json();
        setBracketMatches(data.matches || []);
      }
    });
  }, [selectedTournament, selectedDivision, withLoading]);

  // 대회 또는 부서 변경 시 데이터 조회
  useEffect(() => {
    if (selectedTournament && selectedDivision) {
      fetchBracket();
    }
  }, [fetchBracket]);

  // 관리 페이지로 이동
  const handleManageBracket = () => {
    router.push(
      `/tournament-grouping/bracket?tournamentId=${selectedTournament}&division=${selectedDivision}`,
    );
  };

  return (
    <Container>
      <Box mb="6">
        <Flex align="center" justify="between">
          <Box>
            <Heading size="5" weight="bold" mb="2">
              {tournament?.title || '대회 정보 로딩 중...'}
            </Heading>
            <Text size="3" color="gray">
              {divisionNameMap[selectedDivision] || selectedDivision} • 본선 대진표
            </Text>
          </Box>
          <Flex gap="2">
            <Button size="3" variant="soft" onClick={handleManageBracket}>
              관리
            </Button>
          </Flex>
        </Flex>
      </Box>

      {/* 본선 대진표가 없을 때 */}
      {selectedTournament && selectedDivision && bracketMatches.length === 0 && (
        <Card>
          <Box p="6" style={{ textAlign: 'center' }}>
            <Text size="3" color="gray" mb="4">
              본선 대진표가 생성되지 않았습니다.
            </Text>
            <Button size="3" onClick={handleManageBracket}>
              대진표 생성하기
            </Button>
          </Box>
        </Card>
      )}

      {/* 본선 대진표 표시 */}
      {bracketMatches.length > 0 && (
        <Box>
          <Text size="3" weight="bold" mb="4">
            본선 대진표
          </Text>
          <Flex direction="column" gap="3">
            {bracketMatches.map((match) => (
              <Card key={match._key}>
                <Box p="4">
                  <Flex align="center" justify="between" mb="2">
                    <Text size="2" color="gray">
                      {match.round === 'final' && '결승'}
                      {match.round === 'semifinal' && '준결승'}
                      {match.round === 'quarterfinal' && '8강'}
                      {match.round === 'round16' && '16강'}
                      {match.round === 'round32' && '32강'} • {match.matchNumber}경기
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
