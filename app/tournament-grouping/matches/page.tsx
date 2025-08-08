'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Box, Text, Button, Flex, Card, Heading, Select, Badge, TextField } from '@radix-ui/themes';
import { useLoading } from '@/hooks/useLoading';
import { useTournamentsByUserLevel } from '@/hooks/useTournaments';
import ConfirmDialog from '@/components/ConfirmDialog';
import type { Match, GroupStanding } from '@/types/tournament';
import Container from '@/components/Container';

interface MatchUpdateData {
  team1Score?: number;
  team2Score?: number;
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  court?: string;
}

export default function TournamentMatchesPage() {
  const { data: session } = useSession();
  const { loading, withLoading } = useLoading();

  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [matches, setMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<GroupStanding[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [showScoreDialog, setShowScoreDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [scoreForm, setScoreForm] = useState({
    team1Score: '',
    team2Score: '',
    status: 'scheduled' as 'scheduled' | 'in_progress' | 'completed' | 'cancelled',
    court: '',
  });

  const { tournaments, isLoading: tournamentsLoading } = useTournamentsByUserLevel(
    session?.user?.level,
  );

  // 부서 옵션
  const divisionOptions = [
    { value: 'master', label: '마스터부' },
    { value: 'challenger', label: '챌린저부' },
    { value: 'futures', label: '퓨처스부' },
    { value: 'forsythia', label: '개나리부' },
    { value: 'chrysanthemum', label: '국화부' },
  ];

  // 경기 상태 옵션
  const statusOptions = [
    { value: 'scheduled', label: '예정' },
    { value: 'in_progress', label: '진행중' },
    { value: 'completed', label: '완료' },
    { value: 'cancelled', label: '취소' },
  ];

  // 경기 및 순위 정보 조회
  const fetchMatchData = async () => {
    if (!selectedTournament || !selectedDivision) return;

    return withLoading(async () => {
      // 경기 정보 조회
      const matchesResponse = await fetch(
        `/api/tournament-grouping/matches?tournamentId=${selectedTournament}&division=${selectedDivision}`,
      );

      if (matchesResponse.ok) {
        const matchesData = await matchesResponse.json();
        setMatches(matchesData);
      }

      // 순위 정보 조회
      const standingsResponse = await fetch(
        `/api/tournament-grouping/standings?tournamentId=${selectedTournament}&division=${selectedDivision}`,
      );

      if (standingsResponse.ok) {
        const standingsData = await standingsResponse.json();
        setStandings(standingsData.data || []);
      }
    });
  };

  // 대회 또는 부서 변경 시 데이터 조회
  useEffect(() => {
    if (selectedTournament && selectedDivision) {
      fetchMatchData();
    }
  }, [selectedTournament, selectedDivision]);

  // 경기 결과 업데이트
  const handleUpdateMatch = async (matchId: string, matchData: MatchUpdateData) => {
    return withLoading(async () => {
      console.log('경기 결과 업데이트 요청:', { matchId, matchData });

      const response = await fetch(`/api/tournament-grouping/matches/${matchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(matchData),
      });

      console.log('응답 상태:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('경기 결과 업데이트 오류:', errorData);
        throw new Error(errorData.error || '경기 결과 업데이트에 실패했습니다.');
      }

      const result = await response.json();
      console.log('경기 결과 업데이트 성공:', result);

      setSuccessMessage('경기 결과가 성공적으로 업데이트되었습니다.');
      setShowSuccessDialog(true);
      setShowScoreDialog(false);

      // 데이터 새로고침
      await fetchMatchData();
    });
  };

  // 점수 입력 다이얼로그 열기
  const openScoreDialog = (match: Match) => {
    setSelectedMatch(match);
    setScoreForm({
      team1Score: match.team1.score?.toString() || '',
      team2Score: match.team2.score?.toString() || '',
      status: match.status,
      court: match.court || '',
    });
    setShowScoreDialog(true);
  };

  return (
    <Container>
      <Box mb="6">
        <Heading size="5" weight="bold" mb="2">
          경기 결과 관리
        </Heading>
        <Text size="3" color="gray">
          경기 점수를 입력하고 결과를 관리합니다.
        </Text>
      </Box>

      {/* 대회 및 부서 선택 */}
      <Card mb="6">
        <Box p="4">
          <Heading size="4" weight="bold" mb="4">
            대회 및 부서 선택
          </Heading>

          <Flex direction="column" gap="4">
            <Box>
              <Text size="3" weight="bold" mb="2">
                대회 선택
              </Text>
              <Select.Root
                size="3"
                value={selectedTournament}
                onValueChange={setSelectedTournament}
              >
                <Select.Trigger placeholder="대회를 선택하세요" />
                <Select.Content>
                  {tournaments.map((tournament) => (
                    <Select.Item key={tournament._id} value={tournament._id}>
                      {tournament.title}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </Box>

            <Box>
              <Text size="3" weight="bold" mb="2">
                부서 선택
              </Text>
              <Select.Root size="3" value={selectedDivision} onValueChange={setSelectedDivision}>
                <Select.Trigger placeholder="부서를 선택하세요" />
                <Select.Content>
                  {divisionOptions.map((option) => (
                    <Select.Item key={option.value} value={option.value}>
                      {option.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </Box>
          </Flex>
        </Box>
      </Card>

      {/* 조별 순위 */}
      {standings.length > 0 && (
        <Card mb="6">
          <Box p="4">
            <Heading size="4" weight="bold" mb="4">
              조별 순위
            </Heading>

            {/* 조별로 그룹화하여 표시 */}
            {(() => {
              const standingsByGroup = new Map<string, GroupStanding[]>();

              standings.forEach((standing) => {
                // 조 정보를 가져오기 위해 경기 정보에서 조 찾기
                const match = matches.find(
                  (m) => m.team1.teamId === standing.teamId || m.team2.teamId === standing.teamId,
                );
                const groupId = match?.groupId || 'unknown';

                if (!standingsByGroup.has(groupId)) {
                  standingsByGroup.set(groupId, []);
                }
                standingsByGroup.get(groupId)!.push(standing);
              });

              return Array.from(standingsByGroup.entries()).map(([groupId, groupStandings]) => (
                <Box key={groupId} mb="4">
                  <Text size="3" weight="bold" mb="2">
                    {groupId}
                  </Text>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="p-3 text-left border-b">순위</th>
                          <th className="p-3 text-left border-b">팀명</th>
                          <th className="p-3 text-left border-b">경기</th>
                          <th className="p-3 text-left border-b">승</th>
                          <th className="p-3 text-left border-b">무</th>
                          <th className="p-3 text-left border-b">패</th>
                          <th className="p-3 text-left border-b">득점</th>
                          <th className="p-3 text-left border-b">실점</th>
                          <th className="p-3 text-left border-b">득실차</th>
                          <th className="p-3 text-left border-b">승점</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupStandings.map((standing) => (
                          <tr key={standing.teamId} className="border-b hover:bg-gray-50">
                            <td className="p-3">{standing.position}</td>
                            <td className="p-3">{standing.teamName}</td>
                            <td className="p-3">{standing.played}</td>
                            <td className="p-3">{standing.won}</td>
                            <td className="p-3">{standing.drawn}</td>
                            <td className="p-3">{standing.lost}</td>
                            <td className="p-3">{standing.goalsFor}</td>
                            <td className="p-3">{standing.goalsAgainst}</td>
                            <td className="p-3">{standing.goalDifference}</td>
                            <td className="p-3">{standing.points}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Box>
              ));
            })()}
          </Box>
        </Card>
      )}

      {/* 경기 목록 */}
      {matches.length > 0 && (
        <Card mb="6">
          <Box p="4">
            <Heading size="4" weight="bold" mb="4">
              경기 목록
            </Heading>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-3 text-left border-b">경기 번호</th>
                    <th className="p-3 text-left border-b">조</th>
                    <th className="p-3 text-left border-b">팀 1</th>
                    <th className="p-3 text-left border-b">팀 2</th>
                    <th className="p-3 text-left border-b">점수</th>
                    <th className="p-3 text-left border-b">상태</th>
                    <th className="p-3 text-left border-b">코트</th>
                    <th className="p-3 text-left border-b">액션</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.map((match) => (
                    <tr key={match._id} className="border-b hover:bg-gray-50">
                      <td className="p-3">{match.matchNumber}경기</td>
                      <td className="p-3">{match.groupId || '-'}</td>
                      <td className="p-3">
                        <span
                          className={
                            match.team1.score !== undefined && match.team2.score !== undefined
                              ? match.team1.score > match.team2.score
                                ? 'font-bold text-green-600'
                                : match.team1.score < match.team2.score
                                  ? 'text-gray-500'
                                  : 'font-bold'
                              : ''
                          }
                        >
                          {match.team1.teamName}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={
                            match.team1.score !== undefined && match.team2.score !== undefined
                              ? match.team2.score > match.team1.score
                                ? 'font-bold text-green-600'
                                : match.team2.score < match.team1.score
                                  ? 'text-gray-500'
                                  : 'font-bold'
                              : ''
                          }
                        >
                          {match.team2.teamName}
                        </span>
                      </td>
                      <td className="p-3">
                        {match.team1.score !== undefined && match.team2.score !== undefined ? (
                          <span>
                            <span
                              className={
                                match.team1.score > match.team2.score
                                  ? 'font-bold text-green-600'
                                  : match.team1.score < match.team2.score
                                    ? 'text-gray-500'
                                    : 'font-bold'
                              }
                            >
                              {match.team1.score}
                            </span>
                            <span className="mx-2">-</span>
                            <span
                              className={
                                match.team2.score > match.team1.score
                                  ? 'font-bold text-green-600'
                                  : match.team2.score < match.team1.score
                                    ? 'text-gray-500'
                                    : 'font-bold'
                              }
                            >
                              {match.team2.score}
                            </span>
                          </span>
                        ) : match.team1.score !== undefined ? (
                          <span>
                            <span className="text-gray-500">{match.team1.score}</span>
                            <span className="mx-2">-</span>
                            <span className="text-gray-400">-</span>
                          </span>
                        ) : match.team2.score !== undefined ? (
                          <span>
                            <span className="text-gray-400">-</span>
                            <span className="mx-2">-</span>
                            <span className="text-gray-500">{match.team2.score}</span>
                          </span>
                        ) : (
                          <span className="text-gray-400">- - -</span>
                        )}
                      </td>
                      <td className="p-3">
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
                      </td>
                      <td className="p-3">{match.court || '-'}</td>
                      <td className="p-3">
                        <Button size="1" variant="soft" onClick={() => openScoreDialog(match)}>
                          점수 입력
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Box>
        </Card>
      )}

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
                        handleUpdateMatch(selectedMatch._id, {
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

      {/* 성공 다이얼로그 */}
      <ConfirmDialog
        title="업데이트 완료"
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
