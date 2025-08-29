'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import {
  Box,
  Text,
  Button,
  Flex,
  Card,
  Heading,
  Badge,
  TextField,
  Select,
  Dialog,
} from '@radix-ui/themes';
import { useLoading } from '@/hooks/useLoading';
import { useTournament } from '@/hooks/useTournaments';
import Container from '@/components/Container';
import ConfirmDialog from '@/components/ConfirmDialog';
import LoadingOverlay from '@/components/LoadingOverlay';
import { getNextRound } from '@/lib/tournamentBracketUtils';

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

// 상수들을 컴포넌트 밖으로 이동
const DIVISION_NAME_MAP: Record<string, string> = {
  master: '마스터부',
  challenger: '챌린저부',
  futures: '퓨처스부',
  forsythia: '개나리부',
  chrysanthemum: '국화부',
};

const ROUND_NAME_MAP: Record<string, string> = {
  round32: '32강',
  round16: '16강',
  quarterfinal: '8강',
  semifinal: '4강',
  final: '결승',
};

const STATUS_OPTIONS = [
  { value: 'scheduled', label: '예정' },
  { value: 'in_progress', label: '진행중' },
  { value: 'completed', label: '완료' },
  { value: 'cancelled', label: '취소' },
];

const VALID_ROUNDS = ['round32', 'round16', 'quarterfinal', 'semifinal', 'final'] as const;
type ValidRound = (typeof VALID_ROUNDS)[number];

export default function RoundPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { withLoading, loading } = useLoading();

  const [bracketMatches, setBracketMatches] = useState<BracketMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<BracketMatch | null>(null);
  const [showScoreDialog, setShowScoreDialog] = useState(false);
  const [scoreForm, setScoreForm] = useState({
    team1Score: '',
    team2Score: '',
    team1Name: '',
    team2Name: '',
    status: 'scheduled' as 'scheduled' | 'in_progress' | 'completed' | 'cancelled',
    court: '',
  });
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [hasBracket, setHasBracket] = useState(false);

  // URL에서 파라미터 읽기
  const round = params.round as ValidRound;
  const selectedTournament = searchParams.get('tournamentId') || '';
  const selectedDivision = searchParams.get('division') || '';

  // SWR 훅 사용
  const { tournament } = useTournament(selectedTournament);

  // 현재 라운드 경기만 필터링 (메모이제이션)
  const currentRoundMatches = useMemo(
    () => bracketMatches.filter((m) => m.round === round),
    [bracketMatches, round],
  );

  // 유효한 라운드인지 확인
  const isValidRound = useMemo(() => VALID_ROUNDS.includes(round), [round]);

  // 본선 대진표 존재 여부 확인
  const checkBracketExists = useCallback(async () => {
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
      setHasBracket(false);
    }
  }, [selectedTournament, selectedDivision]);

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
        setHasBracket(data.matches && data.matches.length > 0);
      }
    });
  }, [selectedTournament, selectedDivision, withLoading]);

  // 대회 또는 부서 변경 시 데이터 조회
  useEffect(() => {
    if (selectedTournament && selectedDivision) {
      fetchBracket();
      checkBracketExists();
    }
  }, [fetchBracket, checkBracketExists, selectedTournament, selectedDivision]);

  // 전체 대진표 보기로 이동
  const handleViewAllBracket = useCallback(() => {
    router.push(
      `/tournament-grouping/bracket/view?tournamentId=${selectedTournament}&division=${selectedDivision}`,
    );
  }, [router, selectedTournament, selectedDivision]);

  // 관리 페이지로 이동
  const handleManageBracket = useCallback(() => {
    router.push(
      `/tournament-grouping/bracket?tournamentId=${selectedTournament}&division=${selectedDivision}`,
    );
  }, [router, selectedTournament, selectedDivision]);

  // 특정 라운드로 이동
  const handleNavigateToRound = useCallback(
    (targetRound: string) => {
      router.push(
        `/tournament-grouping/bracket/view/${targetRound}?tournamentId=${selectedTournament}&division=${selectedDivision}`,
      );
    },
    [router, selectedTournament, selectedDivision],
  );

  // 점수 입력 다이얼로그 열기
  const openScoreDialog = useCallback((match: BracketMatch) => {
    setSelectedMatch(match);
    setScoreForm({
      team1Score: match.team1.score?.toString() || '',
      team2Score: match.team2.score?.toString() || '',
      team1Name: match.team1.teamName || '',
      team2Name: match.team2.teamName || '',
      status: match.status,
      court: match.court || '',
    });
    setShowScoreDialog(true);
  }, []);

  // 점수 저장
  const handleSaveScore = useCallback(async () => {
    if (!selectedMatch) return;

    return withLoading(async () => {
      // 입력값 방어코드
      const team1Score = Math.max(0, parseInt(scoreForm.team1Score) || 0);
      const team2Score = Math.max(0, parseInt(scoreForm.team2Score) || 0);

      const response = await fetch(
        `/api/tournament-grouping/bracket/${selectedMatch._key}?tournamentId=${selectedTournament}&division=${selectedDivision}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            team1Score,
            team2Score,
            team1Name: scoreForm.team1Name,
            team2Name: scoreForm.team2Name,
            status: scoreForm.status,
            court: scoreForm.court,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '점수 저장에 실패했습니다.');
      }

      setSuccessMessage('점수가 성공적으로 저장되었습니다.');
      setShowSuccessDialog(true);
      setShowScoreDialog(false);

      // 데이터 새로고침
      await fetchBracket();
    });
  }, [selectedMatch, scoreForm, selectedTournament, selectedDivision, withLoading, fetchBracket]);

  // 현재 라운드의 모든 경기에 랜덤 점수 자동 입력 (병렬 처리)
  const handleAutoScoreCurrentRound = useCallback(async () => {
    return withLoading(async () => {
      console.log(`${ROUND_NAME_MAP[round]} 라운드 모든 경기에 랜덤 점수 자동 입력 시작`);

      // 현재 라운드에서 점수가 입력되지 않은 경기들만 필터링
      const matchesToUpdate = currentRoundMatches.filter(
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

      console.log(`총 ${matchesToUpdate.length}개 경기에 점수 입력 시작`);

      // 순차 처리로 안정성 향상 (병렬 처리에서 발생하는 문제 방지)
      const updateResults = [];
      for (const match of matchesToUpdate) {
        try {
          // 한 팀은 6점, 다른 팀은 0-5점 사이에서 랜덤
          const team1Score = Math.random() < 0.5 ? 6 : Math.floor(Math.random() * 6);
          const team2Score = team1Score === 6 ? Math.floor(Math.random() * 6) : 6;

          console.log(`경기 ${match.matchNumber} 점수 입력 시도: ${team1Score}-${team2Score}`);

          const response = await fetch(
            `/api/tournament-grouping/bracket/${match._key}?tournamentId=${selectedTournament}&division=${selectedDivision}`,
            {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                team1Score,
                team2Score,
                status: 'completed',
                court: match.court || '1',
              }),
            },
          );

          if (!response.ok) {
            const errorData = await response.json();
            console.error(`경기 ${match.matchNumber} 업데이트 실패:`, errorData);
            updateResults.push({
              match: match.matchNumber,
              success: false,
              error: errorData.error,
            });
          } else {
            console.log(`경기 ${match.matchNumber} 업데이트 성공`);
            updateResults.push({ match: match.matchNumber, success: true });
          }

          // 각 경기 사이에 약간의 지연을 두어 서버 부하 방지
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`경기 ${match.matchNumber} 처리 중 오류:`, error);
          updateResults.push({
            match: match.matchNumber,
            success: false,
            error: error instanceof Error ? error.message : '알 수 없는 오류',
          });
        }
      }

      // 결과 분석
      const successfulUpdates = updateResults.filter((result) => result.success);
      const failedUpdates = updateResults.filter((result) => !result.success);

      console.log(`${ROUND_NAME_MAP[round]} 라운드 점수 입력 결과:`, {
        total: matchesToUpdate.length,
        success: successfulUpdates.length,
        failed: failedUpdates.length,
        failedDetails: failedUpdates,
      });

      if (successfulUpdates.length > 0) {
        setSuccessMessage(
          `${successfulUpdates.length}개 경기의 점수가 자동으로 입력되었습니다.${failedUpdates.length > 0 ? ` (${failedUpdates.length}개 실패)` : ''}`,
        );
        setShowSuccessDialog(true);

        // 데이터 새로고침
        await fetchBracket();
      } else {
        setSuccessMessage('점수 입력에 실패했습니다. 콘솔을 확인해주세요.');
        setShowSuccessDialog(true);
      }
    });
  }, [withLoading, currentRoundMatches, selectedTournament, selectedDivision, round, fetchBracket]);

  // 다음 라운드 대진표 생성 함수
  const handleGenerateNextRound = useCallback(async () => {
    return withLoading(async () => {
      console.log(`${ROUND_NAME_MAP[round]} 라운드 완료 확인, 다음 라운드 대진표 생성 시도`);

      // 현재 라운드의 모든 경기가 완료되었는지 확인
      const allCurrentRoundCompleted = currentRoundMatches.every(
        (match) =>
          match.status === 'completed' &&
          match.team1.score !== undefined &&
          match.team2.score !== undefined,
      );

      if (!allCurrentRoundCompleted) {
        setSuccessMessage('현재 라운드의 모든 경기가 완료되지 않았습니다.');
        setShowSuccessDialog(true);
        return;
      }

      try {
        const nextRoundResponse = await fetch('/api/tournament-grouping/bracket', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tournamentId: selectedTournament,
            division: selectedDivision,
            currentRound: round,
          }),
        });

        if (nextRoundResponse.ok) {
          const nextRoundData = await nextRoundResponse.json();
          console.log('다음 라운드 대진표 생성 성공:', nextRoundData);

          setSuccessMessage(
            '다음 라운드 대진표가 성공적으로 생성되었습니다. 다음 라운드로 이동합니다.',
          );
          setShowSuccessDialog(true);

          // 데이터 새로고침
          await fetchBracket();

          // 다음 라운드로 이동
          const nextRound = getNextRound(round);
          if (nextRound) {
            setTimeout(() => {
              router.push(
                `/tournament-grouping/bracket/view/${nextRound}?tournamentId=${selectedTournament}&division=${selectedDivision}`,
              );
            }, 1500); // 1.5초 후 이동
          }
        } else {
          const nextRoundError = await nextRoundResponse.json();
          console.log('다음 라운드 대진표 생성 실패:', nextRoundError);

          setSuccessMessage(`다음 라운드 생성 실패: ${nextRoundError.error}`);
          setShowSuccessDialog(true);
        }
      } catch (nextRoundError) {
        console.error('다음 라운드 대진표 생성 중 오류:', nextRoundError);
        setSuccessMessage('다음 라운드 대진표 생성 중 오류가 발생했습니다.');
        setShowSuccessDialog(true);
      }
    });
  }, [
    withLoading,
    currentRoundMatches,
    selectedTournament,
    selectedDivision,
    round,
    fetchBracket,
    router,
  ]);

  return (
    <Container>
      <Box mb="6">
        <Flex align="center" justify="between">
          <Box>
            <Heading size="5" weight="bold" mb="2">
              {tournament?.title || '대회 정보 로딩 중...'}
            </Heading>
            <Text size="3" color="gray">
              {DIVISION_NAME_MAP[selectedDivision] || selectedDivision} •{' '}
              {ROUND_NAME_MAP[round] || round}
            </Text>
          </Box>
          <Flex gap="2">
            {hasBracket && (
              <Button size="3" color="blue" onClick={handleViewAllBracket}>
                전체 대진표
              </Button>
            )}
            {hasBracket && (
              <Button size="3" color="green" onClick={handleManageBracket}>
                대진표 관리
              </Button>
            )}
          </Flex>
        </Flex>
      </Box>

      {/* 라운드별 이동 버튼 */}
      {hasBracket && bracketMatches.length > 0 && (
        <Card mb="3">
          <Box p="1">
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
      {hasBracket && currentRoundMatches.length > 0 && (
        <Box>
          <Flex align="center" mb="4" justify="between" gap="2">
            <Heading size="4" weight="bold">
              {ROUND_NAME_MAP[round]} 대진표
            </Heading>
            <Box>
              <Button
                size="2"
                color="orange"
                variant="soft"
                onClick={handleAutoScoreCurrentRound}
                disabled={loading}
              >
                {loading ? '점수 입력 중...' : '자동 점수 입력 (순차 처리)'}
              </Button>
              <Button
                size="2"
                color="green"
                variant="soft"
                onClick={handleGenerateNextRound}
                disabled={loading}
                ml="2"
              >
                {loading ? '생성 중...' : '다음 라운드 생성'}
              </Button>
            </Box>
          </Flex>
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
                  <Box p="1">
                    <Text size="2" weight="bold" mb="2">
                      {match.matchNumber}경기 {match.court ? `(${match.court}코트)` : ''}
                    </Text>
                    <Flex align="center" justify="between" mb="2">
                      <Text
                        size="2"
                        className={
                          match.winner === match.team1.teamId ? 'font-bold text-green-600' : ''
                        }
                      >
                        {match.team1.teamName}
                      </Text>
                      {match.team1.score !== undefined && (
                        <Text size="2" color="gray">
                          {match.team1.score}점
                        </Text>
                      )}
                    </Flex>
                    <Flex align="center" justify="between" mb="2">
                      <Text
                        size="2"
                        className={
                          match.winner === match.team2.teamId ? 'font-bold text-green-600' : ''
                        }
                      >
                        {match.team2.teamName}
                      </Text>
                      {match.team2.score !== undefined && (
                        <Text size="2" color="gray">
                          {match.team2.score}점
                        </Text>
                      )}
                    </Flex>
                    <Flex align="center" justify="between" gap="2">
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
                        size="3"
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
                        size="2"
                        variant="soft"
                        onClick={() => openScoreDialog(match)}
                        disabled={loading}
                      >
                        {loading ? '처리 중...' : '점수 입력'}
                      </Button>
                    </Flex>
                  </Box>
                </Card>
              ))}
          </div>
        </Box>
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

      {/* 본선 대진표가 없을 때 */}
      {selectedTournament && selectedDivision && !hasBracket && (
        <Card>
          <Box p="4">
            <Text size="3" color="gray" align="center">
              본선 대진표가 생성되지 않았습니다. 예선 경기 완료 후 본선 대진표를 생성해주세요.
            </Text>
          </Box>
        </Card>
      )}

      {/* 현재 라운드가 없을 때 */}
      {selectedTournament &&
        selectedDivision &&
        isValidRound &&
        hasBracket &&
        currentRoundMatches.length === 0 && (
          <Card>
            <Box p="4">
              <Text size="3" color="gray" align="center">
                {ROUND_NAME_MAP[round]} 대진표가 없습니다.
              </Text>
            </Box>
          </Card>
        )}

      {/* 점수 입력 다이얼로그 */}
      <Dialog.Root open={showScoreDialog} onOpenChange={setShowScoreDialog}>
        <Dialog.Content>
          <Dialog.Title>{selectedMatch?.matchNumber} 경기 점수 입력</Dialog.Title>
          <div className="table-form">
            <table>
              <tbody>
                <tr>
                  <th style={{ width: '80px' }}>팀1 이름</th>
                  <td>
                    <TextField.Root
                      size="3"
                      value={scoreForm.team1Name}
                      onChange={(e) =>
                        setScoreForm((prev) => ({ ...prev, team1Name: e.target.value }))
                      }
                      placeholder="팀1 이름"
                    />
                  </td>
                </tr>
                <tr>
                  <th>팀1 점수</th>
                  <td>
                    <TextField.Root
                      size="3"
                      type="text"
                      value={scoreForm.team1Score}
                      onChange={(e) =>
                        setScoreForm((prev) => ({ ...prev, team1Score: e.target.value }))
                      }
                      placeholder="0"
                      style={{ width: '40px' }}
                    />
                  </td>
                </tr>
                <tr>
                  <th>팀2 이름</th>
                  <td>
                    <TextField.Root
                      size="3"
                      value={scoreForm.team2Name}
                      onChange={(e) =>
                        setScoreForm((prev) => ({ ...prev, team2Name: e.target.value }))
                      }
                      placeholder="팀2 이름"
                    />
                  </td>
                </tr>
                <tr>
                  <th>팀2 점수</th>
                  <td className="text-center">
                    <TextField.Root
                      size="3"
                      type="number"
                      value={scoreForm.team2Score}
                      onChange={(e) =>
                        setScoreForm((prev) => ({ ...prev, team2Score: e.target.value }))
                      }
                      placeholder="0"
                      style={{ width: '40px' }}
                    />
                  </td>
                </tr>
                <tr>
                  <th>경기 상태</th>
                  <td>
                    <Select.Root
                      size="3"
                      value={scoreForm.status}
                      onValueChange={(
                        value: 'scheduled' | 'in_progress' | 'completed' | 'cancelled',
                      ) => setScoreForm((prev) => ({ ...prev, status: value }))}
                    >
                      <Select.Trigger />
                      <Select.Content>
                        {STATUS_OPTIONS.map((option) => (
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
                    <TextField.Root
                      size="3"
                      value={scoreForm.court}
                      onChange={(e) => setScoreForm((prev) => ({ ...prev, court: e.target.value }))}
                      placeholder="코트 번호"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <Box className="btn-wrap mt-3">
            <Dialog.Close>
              <Button size="3" variant="soft">
                취소
              </Button>
            </Dialog.Close>
            <Button size="3" color="green" onClick={handleSaveScore} disabled={loading}>
              {loading ? '저장 중...' : '저장'}
            </Button>
          </Box>
        </Dialog.Content>
      </Dialog.Root>

      {/* 성공 다이얼로그 */}
      <ConfirmDialog
        title="작업 완료"
        description={successMessage}
        confirmText="확인"
        confirmColor="green"
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        onConfirm={() => setShowSuccessDialog(false)}
      />

      {/* 로딩 오버레이 */}
      {loading && <LoadingOverlay />}
    </Container>
  );
}
