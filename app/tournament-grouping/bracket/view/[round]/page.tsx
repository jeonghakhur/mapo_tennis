'use client';

import { useState, useEffect, useCallback } from 'react';
import { Box, Text, Button, Flex, Card, Heading, Badge } from '@radix-ui/themes';
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

interface PageProps {
  params: Promise<{ round: string }>;
}

export default function RoundPage({ params }: PageProps) {
  const { withLoading } = useLoading();

  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [bracketMatches, setBracketMatches] = useState<BracketMatch[]>([]);
  const [round, setRound] = useState<string>('');

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

  // 라운드 이름 매핑
  const roundNameMap: Record<string, string> = {
    round32: '32강',
    round16: '16강',
    quarterfinal: '8강',
    semifinal: '4강',
    final: '결승',
  };

  // URL 파라미터에서 대회 ID, 부서, 라운드 가져오기
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tournamentId = urlParams.get('tournamentId');
    const division = urlParams.get('division');

    if (tournamentId && division) {
      setSelectedTournament(tournamentId);
      setSelectedDivision(division);
    }

    // params에서 라운드 정보 가져오기
    params.then(({ round: roundParam }) => {
      setRound(roundParam);
    });
  }, [params]);

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

  // 전체 대진표 보기로 이동
  const handleViewAllBracket = () => {
    window.location.href = `/tournament-grouping/bracket/view?tournamentId=${selectedTournament}&division=${selectedDivision}`;
  };

  // 관리 페이지로 이동
  const handleManageBracket = () => {
    window.location.href = `/tournament-grouping/bracket?tournamentId=${selectedTournament}&division=${selectedDivision}`;
  };

  // 특정 라운드로 이동
  const handleNavigateToRound = (targetRound: string) => {
    window.location.href = `/tournament-grouping/bracket/view/${targetRound}?tournamentId=${selectedTournament}&division=${selectedDivision}`;
  };

  // 현재 라운드 경기만 필터링
  const currentRoundMatches = bracketMatches.filter((m) => m.round === round);

  // 유효한 라운드인지 확인
  const isValidRound = Object.keys(roundNameMap).includes(round);

  return (
    <Container>
      <Box mb="6">
        <Flex align="center" justify="between">
          <Box>
            <Heading size="5" weight="bold" mb="2">
              {tournament?.title || '대회 정보 로딩 중...'}
            </Heading>
            <Text size="3" color="gray">
              {divisionNameMap[selectedDivision] || selectedDivision} •{' '}
              {roundNameMap[round] || round}
            </Text>
          </Box>
          <Flex gap="2">
            <Button size="3" color="blue" onClick={handleViewAllBracket}>
              전체 대진표
            </Button>
            <Button size="3" color="green" onClick={handleManageBracket}>
              대진표 관리
            </Button>
          </Flex>
        </Flex>
      </Box>

      {/* 라운드별 이동 버튼 */}
      {bracketMatches.length > 0 && (
        <Card mb="6">
          <Box p="4">
            <Heading size="4" weight="bold" mb="4">
              라운드별 보기
            </Heading>
            <Flex gap="2" wrap="wrap">
              {bracketMatches.some((m) => m.round === 'round32') && (
                <Button
                  size="3"
                  variant={round === 'round32' ? 'solid' : 'soft'}
                  onClick={() => handleNavigateToRound('round32')}
                >
                  32강
                </Button>
              )}
              {bracketMatches.some((m) => m.round === 'round16') && (
                <Button
                  size="3"
                  variant={round === 'round16' ? 'solid' : 'soft'}
                  onClick={() => handleNavigateToRound('round16')}
                >
                  16강
                </Button>
              )}
              {bracketMatches.some((m) => m.round === 'quarterfinal') && (
                <Button
                  size="3"
                  variant={round === 'quarterfinal' ? 'solid' : 'soft'}
                  onClick={() => handleNavigateToRound('quarterfinal')}
                >
                  8강
                </Button>
              )}
              {bracketMatches.some((m) => m.round === 'semifinal') && (
                <Button
                  size="3"
                  variant={round === 'semifinal' ? 'solid' : 'soft'}
                  onClick={() => handleNavigateToRound('semifinal')}
                >
                  4강
                </Button>
              )}
              {bracketMatches.some((m) => m.round === 'final') && (
                <Button
                  size="3"
                  variant={round === 'final' ? 'solid' : 'soft'}
                  onClick={() => handleNavigateToRound('final')}
                >
                  결승
                </Button>
              )}
            </Flex>
          </Box>
        </Card>
      )}

      {/* 현재 라운드 대진표 */}
      {currentRoundMatches.length > 0 && (
        <Card mb="6">
          <Box p="4">
            <Heading size="4" weight="bold" mb="4">
              {roundNameMap[round]} 대진표
            </Heading>
            <div
              className={`grid grid-cols-1 gap-4 ${
                round === 'round32' || round === 'round16'
                  ? 'md:grid-cols-2 lg:grid-cols-4'
                  : round === 'quarterfinal' || round === 'semifinal'
                    ? 'md:grid-cols-2'
                    : ''
              }`}
            >
              {currentRoundMatches
                .sort((a, b) => a.matchNumber - b.matchNumber)
                .map((match) => (
                  <Card key={match._key}>
                    <Box p="3">
                      <Text size="2" weight="bold" mb="2">
                        {match.matchNumber}경기
                      </Text>
                      <Box mb="2">
                        <Text
                          size="2"
                          className={
                            match.winner === match.team1.teamId ? 'font-bold text-green-600' : ''
                          }
                        >
                          {match.team1.teamName}
                        </Text>
                        {match.team1.score !== undefined && (
                          <Text size="1" color="gray">
                            {match.team1.score}점
                          </Text>
                        )}
                      </Box>
                      <Box mb="2">
                        <Text
                          size="2"
                          className={
                            match.winner === match.team2.teamId ? 'font-bold text-green-600' : ''
                          }
                        >
                          {match.team2.teamName}
                        </Text>
                        {match.team2.score !== undefined && (
                          <Text size="1" color="gray">
                            {match.team2.score}점
                          </Text>
                        )}
                      </Box>
                      <Badge
                        color={
                          match.status === 'completed'
                            ? 'green'
                            : match.status === 'in_progress'
                              ? 'yellow'
                              : match.status === 'cancelled'
                                ? 'red'
                                : 'gray'
                        }
                        size="1"
                      >
                        {match.status === 'completed'
                          ? '완료'
                          : match.status === 'in_progress'
                            ? '진행중'
                            : match.status === 'cancelled'
                              ? '취소'
                              : '예정'}
                      </Badge>
                    </Box>
                  </Card>
                ))}
            </div>
          </Box>
        </Card>
      )}

      {/* 파라미터가 없을 때 */}
      {(!selectedTournament || !selectedDivision) && (
        <Card>
          <Box p="4">
            <Text size="3" color="gray" align="center">
              대회 ID와 부서 정보가 필요합니다. 올바른 URL로 접근해주세요.
            </Text>
          </Box>
        </Card>
      )}

      {/* 유효하지 않은 라운드일 때 */}
      {selectedTournament && selectedDivision && !isValidRound && (
        <Card>
          <Box p="4">
            <Text size="3" color="gray" align="center">
              유효하지 않은 라운드입니다.
            </Text>
          </Box>
        </Card>
      )}

      {/* 현재 라운드가 없을 때 */}
      {selectedTournament &&
        selectedDivision &&
        isValidRound &&
        currentRoundMatches.length === 0 && (
          <Card>
            <Box p="4">
              <Text size="3" color="gray" align="center">
                {roundNameMap[round]} 대진표가 없습니다.
              </Text>
            </Box>
          </Card>
        )}
    </Container>
  );
}
