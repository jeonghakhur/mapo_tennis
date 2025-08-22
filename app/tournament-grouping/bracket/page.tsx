'use client';

import { useState, useEffect, useCallback } from 'react';
import { Box, Text, Button, Flex, Card, Heading, Badge, TextField, Select } from '@radix-ui/themes';

import { useLoading } from '@/hooks/useLoading';
import { useTournament } from '@/hooks/useTournaments';
import type { Match } from '@/types/tournament';

interface GroupStanding {
  teamId: string;
  teamName: string;
  groupId?: string;
  position: number;
  points: number;
  goalDifference: number;
}
import ConfirmDialog from '@/components/ConfirmDialog';
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

interface BracketData {
  tournamentId: string;
  division: string;
  matches: BracketMatch[];
}

export default function TournamentBracketPage() {
  const { withLoading } = useLoading();

  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [standings, setStandings] = useState<GroupStanding[]>([]);
  const [bracketMatches, setBracketMatches] = useState<BracketMatch[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedMatch, setSelectedMatch] = useState<BracketMatch | null>(null);
  const [showScoreDialog, setShowScoreDialog] = useState(false);
  const [scoreForm, setScoreForm] = useState({
    team1Score: '',
    team2Score: '',
    status: 'scheduled' as 'scheduled' | 'in_progress' | 'completed' | 'cancelled',
    court: '',
  });

  // SWR 훅 사용
  const { tournament } = useTournament(selectedTournament || '');

  // 경기 상태 옵션
  const statusOptions = [
    { value: 'scheduled', label: '예정' },
    { value: 'in_progress', label: '진행중' },
    { value: 'completed', label: '완료' },
    { value: 'cancelled', label: '취소' },
  ];

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

  // 순위 정보 조회
  const fetchStandings = useCallback(async () => {
    if (!selectedTournament || !selectedDivision) return;

    return withLoading(async () => {
      const response = await fetch(
        `/api/tournament-grouping/standings?tournamentId=${selectedTournament}&division=${selectedDivision}`,
      );

      if (response.ok) {
        const data = await response.json();
        setStandings(data.data || []);
      }
    });
  }, [selectedTournament, selectedDivision, withLoading]);

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
      fetchStandings();
      fetchBracket();
    }
  }, [fetchStandings, fetchBracket]);

  // 본선 대진표 생성
  const createBracket = async () => {
    await withLoading(async () => {
      const response = await fetch('/api/tournament-grouping/bracket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId: selectedTournament,
          division: selectedDivision,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '본선 대진표 생성에 실패했습니다.');
      }

      const result = await response.json();
      setSuccessMessage('본선 대진표가 성공적으로 생성되었습니다.');
      setShowSuccessDialog(true);
      setShowCreateDialog(false);

      // 데이터 새로고침
      await fetchBracket();
    });
  };

  // 조별 1,2위 팀 가져오기
  const getQualifiedTeams = () => {
    const qualifiedTeams: GroupStanding[] = [];
    const standingsByGroup = new Map<string, GroupStanding[]>();

    standings.forEach((standing) => {
      const groupId = standing.groupId || 'unknown';

      if (!standingsByGroup.has(groupId)) {
        standingsByGroup.set(groupId, []);
      }
      standingsByGroup.get(groupId)!.push(standing);
    });

    // 각 조별로 1,2위 팀 선정
    standingsByGroup.forEach((groupStandings, groupId) => {
      const sortedStandings = groupStandings.sort((a, b) => a.position - b.position);

      if (sortedStandings[0]) {
        qualifiedTeams.push(sortedStandings[0]); // 1위
      }
      if (sortedStandings[1]) {
        qualifiedTeams.push(sortedStandings[1]); // 2위
      }
    });

    // 조 이름으로 정렬 (A조, B조, C조 순서)
    const sortedQualifiedTeams = qualifiedTeams.sort((a, b) => {
      const groupA = a.groupId?.replace('group_', '').toUpperCase() || '';
      const groupB = b.groupId?.replace('group_', '').toUpperCase() || '';
      return groupA.localeCompare(groupB);
    });

    return sortedQualifiedTeams;
  };

  const qualifiedTeams = getQualifiedTeams();

  // 본선 대진표 경기 결과 업데이트
  const handleUpdateBracketMatch = async (
    matchId: string,
    matchData: {
      team1Score?: number;
      team2Score?: number;
      status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
      court?: string;
    },
  ) => {
    return withLoading(async () => {
      const response = await fetch(
        `/api/tournament-grouping/bracket/${matchId}?tournamentId=${selectedTournament}&division=${selectedDivision}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(matchData),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '경기 결과 업데이트에 실패했습니다.');
      }

      const result = await response.json();
      setSuccessMessage('경기 결과가 성공적으로 업데이트되었습니다.');
      setShowSuccessDialog(true);
      setShowScoreDialog(false);

      // 데이터 새로고침
      await fetchBracket();
    });
  };

  // 다음 라운드 대진표 생성
  const createNextRound = async (currentRound: string) => {
    await withLoading(async () => {
      const response = await fetch('/api/tournament-grouping/bracket', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId: selectedTournament,
          division: selectedDivision,
          currentRound,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '다음 라운드 대진표 생성에 실패했습니다.');
      }

      const result = await response.json();
      setSuccessMessage(result.message || '다음 라운드 대진표가 성공적으로 생성되었습니다.');
      setShowSuccessDialog(true);

      // 데이터 새로고침
      await fetchBracket();
    });
  };

  // 현재 라운드가 완료되었는지 확인
  const isCurrentRoundCompleted = (round: string) => {
    const roundMatches = bracketMatches.filter((m) => m.round === round);
    return roundMatches.length > 0 && roundMatches.every((m) => m.status === 'completed');
  };

  // 다음 라운드 이름 가져오기
  const getNextRoundName = (currentRound: string) => {
    const roundOrder = ['round32', 'round16', 'quarterfinal', 'semifinal', 'final'];
    const currentIndex = roundOrder.indexOf(currentRound);
    if (currentIndex === -1 || currentIndex === roundOrder.length - 1) return null;
    return roundOrder[currentIndex + 1];
  };

  // 점수 입력 다이얼로그 열기
  const openScoreDialog = (match: BracketMatch) => {
    setSelectedMatch(match);
    setScoreForm({
      team1Score: match.team1.score?.toString() || '',
      team2Score: match.team2.score?.toString() || '',
      status: match.status,
      court: match.court || '',
    });
    setShowScoreDialog(true);
  };

  // 보기 페이지로 이동
  const handleViewBracket = () => {
    window.location.href = `/tournament-grouping/bracket/view?tournamentId=${selectedTournament}&division=${selectedDivision}`;
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
              {divisionNameMap[selectedDivision] || selectedDivision} • 본선 대진표 관리
            </Text>
          </Box>
          <Button size="3" color="green" onClick={handleViewBracket}>
            대진표 보기
          </Button>
        </Flex>
      </Box>

      {/* 진출팀 목록 */}
      {qualifiedTeams.length > 0 && (
        <Card mb="6">
          <Box p="4">
            <Heading size="4" weight="bold" mb="4">
              진출팀 목록 ({qualifiedTeams.length}팀)
            </Heading>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-3 text-left border-b">조</th>
                    <th className="p-3 text-left border-b">순위</th>
                    <th className="p-3 text-left border-b">팀명</th>
                    <th className="p-3 text-left border-b">승점</th>
                    <th className="p-3 text-left border-b">득실차</th>
                  </tr>
                </thead>
                <tbody>
                  {qualifiedTeams.map((team) => (
                    <tr key={team.teamId} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        {team.groupId
                          ? team.groupId.replace('group_', '').toUpperCase() + '조'
                          : '-'}
                      </td>
                      <td className="p-3">
                        <Badge color="blue" size="1">
                          {team.position}위
                        </Badge>
                      </td>
                      <td className="p-3 font-medium">{team.teamName}</td>
                      <td className="p-3">{team.points}</td>
                      <td className="p-3">{team.goalDifference}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Box>
        </Card>
      )}

      {/* 본선 대진표 생성 버튼 */}
      {qualifiedTeams.length > 0 && (
        <Card mb="6">
          <Box p="4">
            <Heading size="4" weight="bold" mb="4">
              본선 대진표 생성
            </Heading>
            <Text size="3" color="gray" mb="4">
              진출팀을 기반으로 16강, 8강, 4강, 결승 대진표를 자동 생성합니다.
            </Text>
            <Button size="3" onClick={() => setShowCreateDialog(true)}>
              본선 대진표 생성
            </Button>
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
                          <Button
                            size="1"
                            variant="soft"
                            onClick={() => openScoreDialog(match)}
                            mt="2"
                          >
                            점수 입력
                          </Button>
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
                          <Button
                            size="1"
                            variant="soft"
                            onClick={() => openScoreDialog(match)}
                            mt="2"
                          >
                            점수 입력
                          </Button>
                        </Box>
                      </Card>
                    ))}
                </div>

                {/* 16강 완료 시 8강 생성 버튼 */}
                {isCurrentRoundCompleted('round16') &&
                  !bracketMatches.some((m) => m.round === 'quarterfinal') && (
                    <Box mt="4" p="4" className="bg-blue-50 border border-blue-200 rounded-lg">
                      <Text size="3" weight="bold" mb="2" color="blue">
                        16강이 완료되었습니다!
                      </Text>
                      <Text size="2" color="gray" mb="3">
                        승리한 팀들로 8강 대진표를 생성하시겠습니까?
                      </Text>
                      <Button size="2" color="blue" onClick={() => createNextRound('round16')}>
                        8강 대진표 생성
                      </Button>
                    </Box>
                  )}
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
                        <Button
                          size="1"
                          variant="soft"
                          onClick={() => openScoreDialog(match)}
                          mt="2"
                        >
                          점수 입력
                        </Button>
                      </Card>
                    ))}
                </div>

                {/* 8강 완료 시 4강 생성 버튼 */}
                {isCurrentRoundCompleted('quarterfinal') &&
                  !bracketMatches.some((m) => m.round === 'semifinal') && (
                    <Box mt="4" p="4" className="bg-blue-50 border border-blue-200 rounded-lg">
                      <Text size="3" weight="bold" mb="2" color="blue">
                        8강이 완료되었습니다!
                      </Text>
                      <Text size="2" color="gray" mb="3">
                        승리한 팀들로 4강 대진표를 생성하시겠습니까?
                      </Text>
                      <Button size="2" color="blue" onClick={() => createNextRound('quarterfinal')}>
                        4강 대진표 생성
                      </Button>
                    </Box>
                  )}
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
                        <Button
                          size="1"
                          variant="soft"
                          onClick={() => openScoreDialog(match)}
                          mt="2"
                        >
                          점수 입력
                        </Button>
                      </Card>
                    ))}
                </div>

                {/* 4강 완료 시 결승 생성 버튼 */}
                {isCurrentRoundCompleted('semifinal') &&
                  !bracketMatches.some((m) => m.round === 'final') && (
                    <Box mt="4" p="4" className="bg-blue-50 border border-blue-200 rounded-lg">
                      <Text size="3" weight="bold" mb="2" color="blue">
                        4강이 완료되었습니다!
                      </Text>
                      <Text size="2" color="gray" mb="3">
                        승리한 팀들로 결승 대진표를 생성하시겠습니까?
                      </Text>
                      <Button size="2" color="blue" onClick={() => createNextRound('semifinal')}>
                        결승 대진표 생성
                      </Button>
                    </Box>
                  )}
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
                        <Button
                          size="1"
                          variant="soft"
                          onClick={() => openScoreDialog(match)}
                          mt="2"
                        >
                          점수 입력
                        </Button>
                      </Card>
                    ))}
                </div>
              </Box>
            )}
          </Box>
        </Card>
      )}

      {/* 본선 대진표 생성 확인 다이얼로그 */}
      <ConfirmDialog
        title="본선 대진표 생성"
        description={`진출팀 ${qualifiedTeams.length}팀을 기반으로 본선 토너먼트 대진표를 생성하시겠습니까?\n\n진출팀:\n${qualifiedTeams.map((team, index) => `${index + 1}. ${team.groupId}조 ${team.position}위 - ${team.teamName}`).join('\n')}`}
        confirmText="생성"
        cancelText="취소"
        confirmColor="green"
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onConfirm={createBracket}
      />

      {/* 점수 입력 다이얼로그 */}
      {showScoreDialog && selectedMatch && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Card
            style={{
              maxWidth: '500px',
              width: '90%',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            }}
          >
            <Box p="4">
              <Heading size="4" weight="bold" mb="4">
                {selectedMatch.team1.teamName} vs {selectedMatch.team2.teamName}
              </Heading>

              <Flex direction="column" gap="4">
                <Box>
                  <Text size="3" weight="bold" mb="2">
                    {selectedMatch.team1.teamName} 점수
                  </Text>
                  <TextField.Root
                    size="3"
                    type="number"
                    placeholder="점수 입력"
                    value={scoreForm.team1Score}
                    onChange={(e) =>
                      setScoreForm((prev) => ({ ...prev, team1Score: e.target.value }))
                    }
                  />
                </Box>
                <Box>
                  <Text size="3" weight="bold" mb="2">
                    {selectedMatch.team2.teamName} 점수
                  </Text>
                  <TextField.Root
                    size="3"
                    type="number"
                    placeholder="점수 입력"
                    value={scoreForm.team2Score}
                    onChange={(e) =>
                      setScoreForm((prev) => ({ ...prev, team2Score: e.target.value }))
                    }
                  />
                </Box>
                <Box>
                  <Text size="3" weight="bold" mb="2">
                    경기 상태
                  </Text>
                  <Select.Root
                    size="3"
                    value={scoreForm.status}
                    onValueChange={(value) =>
                      setScoreForm((prev) => ({
                        ...prev,
                        status: value as 'scheduled' | 'in_progress' | 'completed' | 'cancelled',
                      }))
                    }
                  >
                    <Select.Trigger />
                    <Select.Content>
                      {statusOptions.map((option) => (
                        <Select.Item key={option.value} value={option.value}>
                          {option.label}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                </Box>
                <Box>
                  <Text size="3" weight="bold" mb="2">
                    코트
                  </Text>
                  <TextField.Root
                    size="3"
                    placeholder="코트 번호"
                    value={scoreForm.court}
                    onChange={(e) => setScoreForm((prev) => ({ ...prev, court: e.target.value }))}
                  />
                </Box>
                <Flex gap="3" mt="4">
                  <Button
                    size="3"
                    onClick={() => {
                      if (selectedMatch) {
                        handleUpdateBracketMatch(selectedMatch._key, {
                          team1Score: parseInt(scoreForm.team1Score) || undefined,
                          team2Score: parseInt(scoreForm.team2Score) || undefined,
                          status: scoreForm.status,
                          court: scoreForm.court,
                        });
                      }
                    }}
                  >
                    저장
                  </Button>
                  <Button size="3" variant="soft" onClick={() => setShowScoreDialog(false)}>
                    취소
                  </Button>
                </Flex>
              </Flex>
            </Box>
          </Card>
        </div>
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

      {/* 성공 다이얼로그 */}
      <ConfirmDialog
        title="생성 완료"
        description={successMessage}
        confirmText="확인"
        confirmColor="green"
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        onConfirm={() => setShowSuccessDialog(false)}
      />
    </Container>
  );
}
