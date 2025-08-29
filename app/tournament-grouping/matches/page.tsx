'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Text,
  Button,
  Flex,
  Card,
  Heading,
  Select,
  Badge,
  TextField,
  Separator,
} from '@radix-ui/themes';
import { useLoading } from '@/hooks/useLoading';
import { useTournament } from '@/hooks/useTournaments';
import { useMatches } from '@/hooks/useMatches';
import { useStandings } from '@/hooks/useStandings';
import { useGroups } from '@/hooks/useGroups';
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const { withLoading } = useLoading();

  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [showScoreDialog, setShowScoreDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showStandings, setShowStandings] = useState(true);
  const [scoreForm, setScoreForm] = useState({
    team1Score: '',
    team2Score: '',
    status: 'scheduled' as 'scheduled' | 'in_progress' | 'completed' | 'cancelled',
    court: '',
  });

  // SWR 훅들 사용
  const { tournament } = useTournament(selectedTournament || '');
  const { matches, mutate: mutateMatches } = useMatches(
    selectedTournament || null,
    selectedDivision || null,
  );
  const { standings, mutate: mutateStandings } = useStandings(
    selectedTournament || null,
    selectedDivision || null,
  );
  const { groupNameMap } = useGroups(selectedTournament || null, selectedDivision || null);

  // 본선 대진표 존재 여부 확인
  const [hasBracket, setHasBracket] = useState(false);

  // 본선 대진표 확인
  const checkBracket = useCallback(async () => {
    if (!selectedTournament || !selectedDivision) return;

    try {
      const response = await fetch(
        `/api/tournament-grouping/bracket?tournamentId=${selectedTournament}&division=${selectedDivision}`,
      );
      if (response.ok) {
        const data = await response.json();
        setHasBracket(data.matches && data.matches.length > 0);
      }
    } catch (error) {
      console.error('본선 대진표 확인 오류:', error);
    }
  }, [selectedTournament, selectedDivision]);

  // 대회 또는 부서 변경 시 본선 대진표 확인
  useEffect(() => {
    checkBracket();
  }, [checkBracket]);

  // 모든 경기가 완료되었는지 확인
  const allMatchesCompleted =
    matches.length > 0 &&
    matches.every(
      (match) =>
        match.team1.score !== undefined &&
        match.team2.score !== undefined &&
        match.status === 'completed',
    );

  // URL 파라미터에서 대회 ID와 부서 가져오기
  useEffect(() => {
    const tournamentId = searchParams.get('tournamentId');
    const division = searchParams.get('division');

    if (tournamentId && division) {
      setSelectedTournament(tournamentId);
      setSelectedDivision(division);
    }
  }, [searchParams]);

  // 부서 이름 매핑
  const divisionNameMap: Record<string, string> = {
    master: '마스터부',
    challenger: '챌린저부',
    futures: '퓨처스부',
    forsythia: '개나리부',
    chrysanthemum: '국화부',
  };

  // 경기 상태 옵션
  const statusOptions = [
    { value: 'scheduled', label: '예정' },
    { value: 'in_progress', label: '진행중' },
    { value: 'completed', label: '완료' },
    { value: 'cancelled', label: '취소' },
  ];

  // 경기 결과 업데이트
  const handleUpdateMatch = useCallback(
    async (matchId: string, matchData: MatchUpdateData) => {
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

        // SWR 캐시 무효화
        await mutateMatches();
        await mutateStandings();
      });
    },
    [withLoading, mutateMatches, mutateStandings],
  );

  // 모든 경기에 랜덤 점수 자동 입력
  const handleAutoScoreAllMatches = useCallback(async () => {
    return withLoading(async () => {
      console.log('모든 경기에 랜덤 점수 자동 입력 시작');

      // 점수가 입력되지 않은 경기들만 필터링
      const matchesToUpdate = matches.filter(
        (match) =>
          match.team1.score === undefined ||
          match.team2.score === undefined ||
          match.status !== 'completed',
      );

      if (matchesToUpdate.length === 0) {
        setSuccessMessage('업데이트할 경기가 없습니다.');
        setShowSuccessDialog(true);
        return;
      }

      // 각 경기에 대해 랜덤 점수 생성 및 업데이트
      const updatePromises = matchesToUpdate.map(async (match) => {
        // 한 팀은 6점, 다른 팀은 0-5점 사이에서 랜덤
        const team1Score = Math.random() < 0.5 ? 6 : Math.floor(Math.random() * 6);
        const team2Score = team1Score === 6 ? Math.floor(Math.random() * 6) : 6;

        const matchData: MatchUpdateData = {
          team1Score,
          team2Score,
          status: 'completed',
          court: match.court || '1',
        };

        console.log(`경기 ${match.matchNumber} 점수 입력: ${team1Score}-${team2Score}`);

        const response = await fetch(`/api/tournament-grouping/matches/${match._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(matchData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`경기 ${match.matchNumber} 업데이트 실패: ${errorData.error}`);
        }

        return response.json();
      });

      try {
        await Promise.all(updatePromises);
        console.log('모든 경기 점수 자동 입력 완료');

        setSuccessMessage(`${matchesToUpdate.length}개 경기의 점수가 자동으로 입력되었습니다.`);
        setShowSuccessDialog(true);

        // SWR 캐시 무효화
        await mutateMatches();
        await mutateStandings();
      } catch (error) {
        console.error('자동 점수 입력 오류:', error);
        setSuccessMessage(
          `오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        );
        setShowSuccessDialog(true);
      }
    });
  }, [withLoading, matches, mutateMatches, mutateStandings]);

  // 본선 대진표 생성 페이지로 이동
  const handleCreateBracket = () => {
    router.push(
      `/tournament-grouping/bracket?tournamentId=${selectedTournament}&division=${selectedDivision}`,
    );
  };

  // 본선 대진표 상세 페이지로 이동
  const handleViewBracket = () => {
    router.push(
      `/tournament-grouping/bracket/view?tournamentId=${selectedTournament}&division=${selectedDivision}`,
    );
  };

  // 점수 입력 다이얼로그 열기
  const openScoreDialog = (match: Match) => {
    console.log('openScoreDialog', match);
    setSelectedMatch(match);
    setScoreForm({
      team1Score: match.team1.score !== undefined ? match.team1.score.toString() : '',
      team2Score: match.team2.score !== undefined ? match.team2.score.toString() : '',
      status: match.status,
      court: match.court || '',
    });
    setShowScoreDialog(true);
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
              {divisionNameMap[selectedDivision] || selectedDivision}
            </Text>
          </Box>
          <Flex gap="2">
            <Button size="3" color="orange" onClick={handleAutoScoreAllMatches}>
              점수 자동 입력
            </Button>
            {hasBracket && (
              <Button size="3" color="blue" onClick={handleViewBracket}>
                본선 대진표 보기
              </Button>
            )}
          </Flex>
        </Flex>
      </Box>
      {/* 조별 순위 */}
      {standings.length > 0 && (
        <Box>
          <Flex align="center" justify="between" mb="4">
            <Heading size="4" weight="bold">
              조별 순위
            </Heading>
            <Button size="2" variant="soft" onClick={() => setShowStandings(!showStandings)}>
              {showStandings ? '숨기기' : '보기'}
            </Button>
          </Flex>

          {/* 조별로 그룹화하여 표시 */}
          {showStandings &&
            (() => {
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

              return Array.from(standingsByGroup.entries())
                .sort(([a], [b]) => {
                  const aName = groupNameMap[a] || a;
                  const bName = groupNameMap[b] || b;
                  return aName.localeCompare(bName);
                })
                .map(([groupId, groupStandings]) => (
                  <Box key={groupId} mb="4">
                    <Text size="3" weight="bold" mb="2">
                      {groupNameMap[groupId] || groupId}
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
      )}
      <Separator size="4" my="4" />

      {/* 경기 목록 */}
      {matches.length > 0 && (
        <Box>
          <Flex align="center" justify="between" mb="4">
            <Heading size="4" weight="bold">
              경기 목록
            </Heading>
            {allMatchesCompleted && (
              <Button size="3" color="green" onClick={handleCreateBracket}>
                본선 대진표 생성
              </Button>
            )}
          </Flex>

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
                {matches
                  .sort((a, b) => {
                    const aGroupName = groupNameMap[a.groupId || ''] || a.groupId || '';
                    const bGroupName = groupNameMap[b.groupId || ''] || b.groupId || '';
                    if (aGroupName !== bGroupName) {
                      return aGroupName.localeCompare(bGroupName);
                    }
                    return (a.matchNumber || 0) - (b.matchNumber || 0);
                  })
                  .map((match) => (
                    <tr
                      key={match._id || `match-${match.matchNumber}-${match.team1.teamId}`}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="p-3">{match.matchNumber}경기</td>
                      <td className="p-3">
                        {groupNameMap[match.groupId || ''] || match.groupId || '-'}
                      </td>
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
                        <Button size="2" variant="soft" onClick={() => openScoreDialog(match)}>
                          점수 입력
                        </Button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Box>
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
                {groupNameMap[selectedMatch.groupId || ''] || selectedMatch.groupId || '-'} •{' '}
                {selectedMatch.matchNumber}경기
              </Heading>
              <Box className="table-form">
                <table>
                  <tbody>
                    <tr>
                      <th colSpan={2}>{selectedMatch.team1.teamName}</th>
                    </tr>
                    <tr>
                      <th>점수 </th>
                      <td>
                        <TextField.Root
                          size="3"
                          type="number"
                          placeholder="점수 입력"
                          value={scoreForm.team1Score}
                          onChange={(e) =>
                            setScoreForm((prev) => ({ ...prev, team1Score: e.target.value }))
                          }
                        />
                      </td>
                    </tr>
                    <tr>
                      <th colSpan={2}>{selectedMatch.team2.teamName}</th>
                    </tr>
                    <tr>
                      <th>점수</th>
                      <td>
                        <TextField.Root
                          size="3"
                          type="number"
                          placeholder="점수 입력"
                          value={scoreForm.team2Score}
                          onChange={(e) =>
                            setScoreForm((prev) => ({ ...prev, team2Score: e.target.value }))
                          }
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>경기 상태</th>
                      <td>
                        <Select.Root
                          size="3"
                          value={scoreForm.status}
                          onValueChange={(value) =>
                            setScoreForm((prev) => ({
                              ...prev,
                              status: value as
                                | 'scheduled'
                                | 'in_progress'
                                | 'completed'
                                | 'cancelled',
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
                      </td>
                    </tr>
                    <tr>
                      <th>코트</th>
                      <td>
                        {' '}
                        <TextField.Root
                          size="3"
                          placeholder="코트 번호"
                          value={scoreForm.court}
                          onChange={(e) =>
                            setScoreForm((prev) => ({ ...prev, court: e.target.value }))
                          }
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </Box>

              <Box className="btn-wrap" mt="4">
                <Button
                  size="3"
                  onClick={() => {
                    if (selectedMatch) {
                      const team1Score =
                        scoreForm.team1Score.trim() === ''
                          ? undefined
                          : parseInt(scoreForm.team1Score);
                      const team2Score =
                        scoreForm.team2Score.trim() === ''
                          ? undefined
                          : parseInt(scoreForm.team2Score);

                      handleUpdateMatch(selectedMatch._id, {
                        team1Score,
                        team2Score,
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
              </Box>
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
