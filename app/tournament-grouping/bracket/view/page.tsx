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

export default function TournamentBracketViewPage() {
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
    const urlParams = new URLSearchParams(window.location.search);
    const tournamentId = urlParams.get('tournamentId');
    const division = urlParams.get('division');

    if (tournamentId && division) {
      setSelectedTournament(tournamentId);
      setSelectedDivision(division);
    }
  }, []);

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
    window.location.href = `/tournament-grouping/bracket?tournamentId=${selectedTournament}&division=${selectedDivision}`;
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
            <Button size="3" color="blue" onClick={handleManageBracket}>
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
                  variant="soft"
                  onClick={() =>
                    (window.location.href = `/tournament-grouping/bracket/view/round32?tournamentId=${selectedTournament}&division=${selectedDivision}`)
                  }
                >
                  32강
                </Button>
              )}
              {bracketMatches.some((m) => m.round === 'round16') && (
                <Button
                  size="3"
                  variant="soft"
                  onClick={() =>
                    (window.location.href = `/tournament-grouping/bracket/view/round16?tournamentId=${selectedTournament}&division=${selectedDivision}`)
                  }
                >
                  16강
                </Button>
              )}
              {bracketMatches.some((m) => m.round === 'quarterfinal') && (
                <Button
                  size="3"
                  variant="soft"
                  onClick={() =>
                    (window.location.href = `/tournament-grouping/bracket/view/quarterfinal?tournamentId=${selectedTournament}&division=${selectedDivision}`)
                  }
                >
                  8강
                </Button>
              )}
              {bracketMatches.some((m) => m.round === 'semifinal') && (
                <Button
                  size="3"
                  variant="soft"
                  onClick={() =>
                    (window.location.href = `/tournament-grouping/bracket/view/semifinal?tournamentId=${selectedTournament}&division=${selectedDivision}`)
                  }
                >
                  4강
                </Button>
              )}
              {bracketMatches.some((m) => m.round === 'final') && (
                <Button
                  size="3"
                  variant="soft"
                  onClick={() =>
                    (window.location.href = `/tournament-grouping/bracket/view/final?tournamentId=${selectedTournament}&division=${selectedDivision}`)
                  }
                >
                  결승
                </Button>
              )}
            </Flex>
          </Box>
        </Card>
      )}

      {/* 본선 대진표 */}
      {bracketMatches.length > 0 && (
        <Card mb="6">
          <Box p="4">
            <Heading size="4" weight="bold" mb="4">
              본선 대진표
            </Heading>

            {/* 32강 */}
            {bracketMatches.filter((m) => m.round === 'round32').length > 0 && (
              <Box mb="6">
                <Heading size="3" weight="bold" mb="3">
                  32강
                </Heading>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {bracketMatches
                    .filter((m) => m.round === 'round32')
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
                                match.winner === match.team1.teamId
                                  ? 'font-bold text-green-600'
                                  : ''
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
                                match.winner === match.team2.teamId
                                  ? 'font-bold text-green-600'
                                  : ''
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
            )}

            {/* 16강 */}
            {bracketMatches.filter((m) => m.round === 'round16').length > 0 && (
              <Box mb="6">
                <Heading size="3" weight="bold" mb="3">
                  16강
                </Heading>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {bracketMatches
                    .filter((m) => m.round === 'round16')
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
                                match.winner === match.team1.teamId
                                  ? 'font-bold text-green-600'
                                  : ''
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
                                match.winner === match.team2.teamId
                                  ? 'font-bold text-green-600'
                                  : ''
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
            )}

            {/* 8강 */}
            {bracketMatches.filter((m) => m.round === 'quarterfinal').length > 0 && (
              <Box mb="6">
                <Heading size="3" weight="bold" mb="3">
                  8강
                </Heading>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bracketMatches
                    .filter((m) => m.round === 'quarterfinal')
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
                                match.winner === match.team1.teamId
                                  ? 'font-bold text-green-600'
                                  : ''
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
                                match.winner === match.team2.teamId
                                  ? 'font-bold text-green-600'
                                  : ''
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
            )}

            {/* 4강 */}
            {bracketMatches.filter((m) => m.round === 'semifinal').length > 0 && (
              <Box mb="6">
                <Heading size="3" weight="bold" mb="3">
                  4강
                </Heading>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bracketMatches
                    .filter((m) => m.round === 'semifinal')
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
                                match.winner === match.team1.teamId
                                  ? 'font-bold text-green-600'
                                  : ''
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
                                match.winner === match.team2.teamId
                                  ? 'font-bold text-green-600'
                                  : ''
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
            )}

            {/* 결승 */}
            {bracketMatches.filter((m) => m.round === 'final').length > 0 && (
              <Box mb="6">
                <Heading size="3" weight="bold" mb="3">
                  결승
                </Heading>
                <div className="grid grid-cols-1 gap-4">
                  {bracketMatches
                    .filter((m) => m.round === 'final')
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
                                match.winner === match.team1.teamId
                                  ? 'font-bold text-green-600'
                                  : ''
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
                                match.winner === match.team2.teamId
                                  ? 'font-bold text-green-600'
                                  : ''
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
            )}
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

      {/* 대진표가 없을 때 */}
      {selectedTournament && selectedDivision && bracketMatches.length === 0 && (
        <Card>
          <Box p="4">
            <Text size="3" color="gray" align="center">
              아직 본선 대진표가 생성되지 않았습니다.
            </Text>
          </Box>
        </Card>
      )}
    </Container>
  );
}
