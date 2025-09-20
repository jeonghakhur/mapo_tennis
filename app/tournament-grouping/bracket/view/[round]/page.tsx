'use client';

import { useState, useEffect, useCallback, useMemo, Fragment } from 'react';
import { useSession } from 'next-auth/react';
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
import { useUser } from '@/hooks/useUser';
import { isAdmin } from '@/lib/authUtils';

interface SetScore {
  _key: string;
  setNumber: number;
  games: number;
  tiebreak?: number;
  players: string[];
}

interface BracketMatch {
  _key: string;
  _id: string;
  round: 'round32' | 'round16' | 'quarterfinal' | 'semifinal' | 'final';
  matchNumber: number;
  team1: {
    teamId: string;
    teamName: string;
    score?: number;
    sets?: SetScore[];
    totalSetsWon?: number;
  };
  team2: {
    teamId: string;
    teamName: string;
    score?: number;
    sets?: SetScore[];
    totalSetsWon?: number;
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
  const { data: session } = useSession();
  const { user } = useUser(session?.user?.email);
  const { withLoading, loading } = useLoading();

  const [bracketMatches, setBracketMatches] = useState<BracketMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<BracketMatch | null>(null);
  const [showScoreDialog, setShowScoreDialog] = useState(false);
  const [scoreForm, setScoreForm] = useState({
    team1Sets: [] as SetScore[],
    team2Sets: [] as SetScore[],
    status: 'scheduled' as 'scheduled' | 'in_progress' | 'completed' | 'cancelled',
    court: '',
  });
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [hasBracket, setHasBracket] = useState(false);
  const [showDeleteRoundDialog, setShowDeleteRoundDialog] = useState(false);

  // 관리자 권한 확인
  const admin = isAdmin(user);

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

  // 세트 점수 추가
  const addSet = () => {
    const currentTeam1Sets = scoreForm.team1Sets;
    const currentTeam2Sets = scoreForm.team2Sets;
    const newSetNumber = Math.max(currentTeam1Sets.length, currentTeam2Sets.length) + 1;

    if (newSetNumber > 5) return; // 최대 5세트

    // 고유한 _key 생성
    const setKey = `set-${newSetNumber}-${Date.now()}`;

    const newSet: SetScore = {
      _key: setKey,
      setNumber: newSetNumber,
      games: 0,
      players: ['', ''], // 빈 문자열 2개
    };

    const newSet2: SetScore = {
      _key: setKey,
      setNumber: newSetNumber,
      games: 0,
      players: ['', ''], // 빈 문자열 2개
    };

    setScoreForm((prev) => ({
      ...prev,
      team1Sets: [...prev.team1Sets, newSet],
      team2Sets: [...prev.team2Sets, newSet2],
    }));
  };

  // 세트 점수 제거
  const removeSet = (setIndex: number) => {
    setScoreForm((prev) => ({
      ...prev,
      team1Sets: prev.team1Sets.filter((_, index) => index !== setIndex),
      team2Sets: prev.team2Sets.filter((_, index) => index !== setIndex),
    }));
  };

  // 세트 점수 업데이트
  const updateSetScore = (
    team: 'team1' | 'team2',
    setIndex: number,
    field: 'games' | 'tiebreak' | 'players',
    value: number | string[],
  ) => {
    setScoreForm((prev) => {
      const sets = [...prev[team === 'team1' ? 'team1Sets' : 'team2Sets']];
      sets[setIndex] = { ...sets[setIndex], [field]: value };
      return {
        ...prev,
        [team === 'team1' ? 'team1Sets' : 'team2Sets']: sets,
      };
    });
  };

  // 세트별 선수명 업데이트
  const updatePlayerName = (
    team: 'team1' | 'team2',
    setIndex: number,
    playerIndex: number,
    name: string,
  ) => {
    const currentSet = scoreForm[team === 'team1' ? 'team1Sets' : 'team2Sets'][setIndex];
    const currentPlayers = currentSet.players || [];
    const newPlayers = [...currentPlayers];
    newPlayers[playerIndex] = name;
    updateSetScore(team, setIndex, 'players', newPlayers);
  };

  // 승리한 세트 수 계산
  const calculateSetsWon = useCallback(
    (team1Sets: SetScore[], team2Sets: SetScore[]): { team1: number; team2: number } => {
      let team1Won = 0;
      let team2Won = 0;

      const maxSets = Math.max(team1Sets.length, team2Sets.length);

      for (let i = 0; i < maxSets; i++) {
        const team1Games = team1Sets[i]?.games || 0;
        const team2Games = team2Sets[i]?.games || 0;
        const team1Tiebreak = team1Sets[i]?.tiebreak;
        const team2Tiebreak = team2Sets[i]?.tiebreak;

        // 게임 수로 승부 결정
        if (team1Games > team2Games) {
          team1Won++;
        } else if (team2Games > team1Games) {
          team2Won++;
        } else {
          // 게임 수가 동일한 경우 타이브레이크로 승부 결정
          if (team1Tiebreak !== undefined && team2Tiebreak !== undefined) {
            if (team1Tiebreak > team2Tiebreak) {
              team1Won++;
            } else if (team2Tiebreak > team1Tiebreak) {
              team2Won++;
            }
            // 타이브레이크도 동일하면 무승부 (둘 다 승리하지 않음)
          }
          // 타이브레이크 점수가 없으면 무승부 (둘 다 승리하지 않음)
        }
      }

      return { team1: team1Won, team2: team2Won };
    },
    [],
  );

  // 점수 입력 다이얼로그 열기
  const openScoreDialog = useCallback((match: BracketMatch) => {
    setSelectedMatch(match);

    // 기본적으로 1세트가 있도록 설정
    const team1Sets =
      match.team1.sets && match.team1.sets.length > 0
        ? match.team1.sets.map((set, index) => ({
            ...set,
            _key: set._key || `existing-set-${index}-${Date.now()}`,
            // 선수명이 없으면 기본값 설정
            players: set.players && set.players.length > 0 ? set.players : ['', ''],
          }))
        : [
            {
              _key: `set-1-${Date.now()}`,
              setNumber: 1,
              games: 0,
              players: ['', ''],
            },
          ];

    const team2Sets =
      match.team2.sets && match.team2.sets.length > 0
        ? match.team2.sets.map((set, index) => ({
            ...set,
            _key: set._key || `existing-set-${index}-${Date.now()}`,
            // 선수명이 없으면 기본값 설정
            players: set.players && set.players.length > 0 ? set.players : ['', ''],
          }))
        : [
            {
              _key: `set-1-${Date.now()}`,
              setNumber: 1,
              games: 0,
              players: ['', ''],
            },
          ];

    setScoreForm({
      team1Sets,
      team2Sets,
      status: match.status,
      court: match.court || '',
    });
    setShowScoreDialog(true);
  }, []);

  // 점수 저장
  const handleSaveScore = useCallback(async () => {
    if (!selectedMatch) return;

    return withLoading(async () => {
      const setsWon = calculateSetsWon(scoreForm.team1Sets, scoreForm.team2Sets);

      // 승자 결정
      let winner = undefined;
      if (setsWon.team1 > setsWon.team2) {
        winner = selectedMatch.team1.teamId;
      } else if (setsWon.team2 > setsWon.team1) {
        winner = selectedMatch.team2.teamId;
      }

      const response = await fetch(
        `/api/tournament-grouping/bracket/${selectedMatch._key}?tournamentId=${selectedTournament}&division=${selectedDivision}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            team1Sets: scoreForm.team1Sets,
            team2Sets: scoreForm.team2Sets,
            team1TotalSetsWon: setsWon.team1,
            team2TotalSetsWon: setsWon.team2,
            winner,
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
  }, [
    selectedMatch,
    scoreForm,
    selectedTournament,
    selectedDivision,
    withLoading,
    fetchBracket,
    calculateSetsWon,
  ]);

  // 팀명에서 선수 이름 추출하는 공통 함수
  const extractPlayerNames = useCallback((teamName: string): [string, string] => {
    try {
      const parts = teamName.split('-');
      if (parts.length >= 3) {
        return [parts[1].split(',')[0].trim(), parts[2].trim()];
      }
      return [teamName, ''];
    } catch (error) {
      console.error('선수 이름 추출 오류:', error);
      return [teamName, ''];
    }
  }, []);

  // 현재 라운드의 모든 경기에 랜덤 점수 자동 입력 (세트별 점수 생성)
  const handleAutoScoreCurrentRound = useCallback(async () => {
    return withLoading(async () => {
      console.log(`${ROUND_NAME_MAP[round]} 라운드 모든 경기에 랜덤 점수 자동 입력 시작`);

      // 현재 라운드에서 점수가 입력되지 않은 경기들만 필터링
      const matchesToUpdate = currentRoundMatches.filter(
        (match) =>
          !match.team1.sets ||
          !match.team2.sets ||
          match.team1.sets.length === 0 ||
          match.team2.sets.length === 0 ||
          match.status !== 'completed',
      );

      if (matchesToUpdate.length === 0) {
        setSuccessMessage('업데이트할 경기가 없습니다.');
        setShowSuccessDialog(true);
        return;
      }

      console.log(`총 ${matchesToUpdate.length}개 경기에 점수 입력 시작`);

      // 순차 처리로 안정성 향상
      const updateResults = [];
      for (const match of matchesToUpdate) {
        try {
          // 3세트 경기로 가정
          const team1Sets: SetScore[] = [];
          const team2Sets: SetScore[] = [];

          // 선수 이름 추출
          const team1Players = extractPlayerNames(match.team1.teamName);
          const team2Players = extractPlayerNames(match.team2.teamName);

          for (let i = 1; i <= 3; i++) {
            const team1Games = Math.random() < 0.5 ? 6 : Math.floor(Math.random() * 6);
            const team2Games = team1Games === 6 ? Math.floor(Math.random() * 6) : 6;

            const setKey = `set-${i}-${Date.now()}-${Math.random()}`;

            team1Sets.push({
              _key: setKey,
              setNumber: i,
              games: team1Games,
              players: team1Players,
            });
            team2Sets.push({
              _key: setKey,
              setNumber: i,
              games: team2Games,
              players: team2Players,
            });
          }

          // 승리한 세트 수 계산
          const setsWon = calculateSetsWon(team1Sets, team2Sets);

          // 승자 결정
          let winner = undefined;
          if (setsWon.team1 > setsWon.team2) {
            winner = match.team1.teamId;
          } else if (setsWon.team2 > setsWon.team1) {
            winner = match.team2.teamId;
          }

          console.log(`경기 ${match.matchNumber} 세트 점수 입력:`, { team1Sets, team2Sets });

          const response = await fetch(
            `/api/tournament-grouping/bracket/${match._key}?tournamentId=${selectedTournament}&division=${selectedDivision}`,
            {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                team1Sets,
                team2Sets,
                team1TotalSetsWon: setsWon.team1,
                team2TotalSetsWon: setsWon.team2,
                winner,
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
  }, [
    withLoading,
    currentRoundMatches,
    selectedTournament,
    selectedDivision,
    round,
    fetchBracket,
    extractPlayerNames,
    calculateSetsWon,
  ]);

  // 다음 라운드 대진표 생성 함수
  const handleGenerateNextRound = useCallback(async () => {
    return withLoading(async () => {
      console.log(`${ROUND_NAME_MAP[round]} 라운드 완료 확인, 다음 라운드 대진표 생성 시도`);

      // 현재 라운드의 모든 경기가 완료되었는지 확인 (세트 기반)
      const allCurrentRoundCompleted = currentRoundMatches.every(
        (match) =>
          match.status === 'completed' &&
          match.team1.totalSetsWon !== undefined &&
          match.team2.totalSetsWon !== undefined &&
          match.winner !== undefined,
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

  // 현재 라운드 삭제 함수
  const handleDeleteCurrentRound = useCallback(async () => {
    await withLoading(async () => {
      console.log(`${ROUND_NAME_MAP[round]} 라운드 삭제 시작`);

      try {
        const response = await fetch('/api/tournament-grouping/bracket/delete-round', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tournamentId: selectedTournament,
            division: selectedDivision,
            round: round,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log('라운드 삭제 성공:', result);

          setSuccessMessage(`${ROUND_NAME_MAP[round]} 라운드가 성공적으로 삭제되었습니다.`);
          setShowSuccessDialog(true);
          setShowDeleteRoundDialog(false);

          // 데이터 새로고침
          await fetchBracket();

          // 삭제 후 남은 라운드 확인
          const updatedBracketResponse = await fetch(
            `/api/tournament-grouping/bracket?tournamentId=${selectedTournament}&division=${selectedDivision}`,
          );

          let targetUrl: string;
          if (updatedBracketResponse.ok) {
            const updatedBracketData = await updatedBracketResponse.json();
            const remainingMatches = updatedBracketData.matches || [];

            if (remainingMatches.length === 0) {
              // 모든 라운드가 삭제된 경우 대진표 관리 페이지로 이동
              targetUrl = `/tournament-grouping/bracket?tournamentId=${selectedTournament}&division=${selectedDivision}`;
            } else {
              // 남은 라운드 중 가장 마지막 라운드로 이동
              const remainingRounds = [
                ...new Set(remainingMatches.map((match: { round: string }) => match.round)),
              ];
              const roundOrder = ['round32', 'round16', 'quarterfinal', 'semifinal', 'final'];

              // 남은 라운드 중 가장 마지막 순서의 라운드 찾기
              let lastRemainingRound = remainingRounds[0];
              for (const remainingRound of remainingRounds) {
                const currentIndex = roundOrder.indexOf(remainingRound as string);
                const lastIndex = roundOrder.indexOf(lastRemainingRound as string);
                if (currentIndex > lastIndex) {
                  lastRemainingRound = remainingRound;
                }
              }

              targetUrl = `/tournament-grouping/bracket/view/${lastRemainingRound}?tournamentId=${selectedTournament}&division=${selectedDivision}`;
            }
          } else {
            // API 호출 실패 시 대진표 관리 페이지로 이동
            targetUrl = `/tournament-grouping/bracket?tournamentId=${selectedTournament}&division=${selectedDivision}`;
          }

          // 1.5초 후 이동
          setTimeout(() => {
            router.push(targetUrl);
          }, 1500);
        } else {
          const errorData = await response.json();
          console.error('라운드 삭제 실패:', errorData);
          setSuccessMessage(`라운드 삭제 실패: ${errorData.error}`);
          setShowSuccessDialog(true);
        }
      } catch (error) {
        console.error('라운드 삭제 중 오류:', error);
        setSuccessMessage('라운드 삭제 중 오류가 발생했습니다.');
        setShowSuccessDialog(true);
      }
    });
  }, [withLoading, selectedTournament, selectedDivision, round, fetchBracket, router]);

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
                예선결과보기
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
          <Flex direction="column" mt="4" mb="4" gap="2">
            <Heading size="4" weight="bold">
              {ROUND_NAME_MAP[round]} 대진표
            </Heading>
            {admin && (
              <Box>
                <Button
                  size="2"
                  color="orange"
                  variant="soft"
                  onClick={handleAutoScoreCurrentRound}
                  disabled={loading}
                >
                  {loading ? '점수 입력 중...' : '자동점수 입력'}
                </Button>

                <Button
                  size="2"
                  color="green"
                  variant="soft"
                  onClick={handleGenerateNextRound}
                  disabled={loading}
                  ml="2"
                >
                  {loading ? '생성 중...' : '다음라운드 생성'}
                </Button>

                <Button
                  size="2"
                  color="red"
                  variant="soft"
                  onClick={() => setShowDeleteRoundDialog(true)}
                  disabled={loading}
                  ml="2"
                >
                  {loading ? '삭제 중...' : '라운드 삭제'}
                </Button>
              </Box>
            )}
          </Flex>
          <div
            className={`grid grid-cols-1 gap-4 ${
              round === 'round32' || round === 'round16'
                ? 'md:grid-cols-2 lg:grid-cols-3'
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
                    </Flex>
                    {/* 세트별 상세 정보 */}
                    {match.team1.sets && match.team1.sets.length > 0 && (
                      <Box mb="2">
                        <div className="table-view">
                          <table>
                            <thead>
                              <tr>
                                <td>세트</td>
                                <td>클럽명</td>
                                <td>선수</td>
                                <td>점수</td>
                              </tr>
                            </thead>
                            <tbody>
                              {match.team1.sets.map((_, setIndex) => {
                                const team1Set = match.team1.sets?.[setIndex];
                                const team2Set = match.team2.sets?.[setIndex];

                                if (!team1Set || !team2Set) return null;
                                const team1Players =
                                  team1Set.players?.filter((p) => p.trim()) || [];
                                const team2Players =
                                  team2Set.players?.filter((p) => p.trim()) || [];

                                if (!team1Set || !team2Set) return null;

                                return (
                                  <Fragment key={setIndex}>
                                    <tr>
                                      <td rowSpan={2}>{setIndex + 1}세트</td>
                                      <td className="text-blue-600">
                                        {match.team1.teamName.split(' - ')[0]}
                                      </td>
                                      <td>{team1Players.join(', ')}</td>
                                      <td className="text-blue-600">
                                        {team1Set.games}
                                        {team1Set.tiebreak !== undefined && (
                                          <>({team1Set.tiebreak})</>
                                        )}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="text-green-600">
                                        {match.team2.teamName.split(' - ')[0]}
                                      </td>
                                      <td>{team2Players.join(', ')}</td>
                                      <td className="text-green-600">
                                        {team2Set.games}
                                        {team2Set.tiebreak !== undefined && (
                                          <>({team2Set.tiebreak})</>
                                        )}
                                      </td>
                                    </tr>
                                  </Fragment>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </Box>
                    )}

                    {/* 세트별 선수 정보 */}

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
        <Dialog.Content style={{ width: '100%' }}>
          <Dialog.Title>
            {selectedMatch && (
              <>
                {ROUND_NAME_MAP[selectedMatch.round] || selectedMatch.round} •{' '}
                {selectedMatch.matchNumber}경기
              </>
            )}
          </Dialog.Title>
          <Dialog.Description mb="4">
            {selectedMatch?.team1.teamName}
            <br />
            {selectedMatch?.team2.teamName}
          </Dialog.Description>

          <Flex direction="column" gap="4" style={{ overflowY: 'auto', maxHeight: '70vh' }}>
            {/* 세트별 점수 입력 */}
            {scoreForm.team1Sets.map((_, setIndex) => (
              <Box key={setIndex}>
                <Text size="3" weight="bold" mb="3" as="div">
                  {setIndex + 1}세트
                </Text>

                {/* 팀 점수 입력 컴포넌트 */}
                {[
                  {
                    teamKey: 'team1' as const,
                    teamName: selectedMatch?.team1.teamName.split(' - ')[0] || '',
                    color: 'blue' as const,
                  },
                  {
                    teamKey: 'team2' as const,
                    teamName: selectedMatch?.team2.teamName.split(' - ')[0] || '',
                    color: 'green' as const,
                  },
                ].map(({ teamKey, teamName, color }) => (
                  <Box key={teamKey}>
                    <Text size="2" weight="bold" my="2" color={color} as="div">
                      {teamName}
                    </Text>
                    <div className="table-form">
                      <table>
                        <tbody>
                          <tr>
                            <th style={{ width: '60px' }}>점수</th>
                            <td>
                              <Flex gap="2">
                                <TextField.Root
                                  type="number"
                                  placeholder="게임"
                                  value={scoreForm[`${teamKey}Sets`][setIndex]?.games || 0}
                                  onChange={(e) =>
                                    updateSetScore(
                                      teamKey,
                                      setIndex,
                                      'games',
                                      parseInt(e.target.value) || 0,
                                    )
                                  }
                                  style={{ width: '50px' }}
                                  size="3"
                                />
                                <TextField.Root
                                  size="3"
                                  placeholder="타이"
                                  value={scoreForm[`${teamKey}Sets`][setIndex]?.tiebreak || ''}
                                  onChange={(e) =>
                                    updateSetScore(
                                      teamKey,
                                      setIndex,
                                      'tiebreak',
                                      parseInt(e.target.value) || 0,
                                    )
                                  }
                                  style={{ width: '50px' }}
                                />
                              </Flex>
                            </td>
                          </tr>
                          <tr>
                            <th>선수명</th>
                            <td>
                              <Flex gap="2">
                                {[0, 1].map((playerIndex) => (
                                  <TextField.Root
                                    key={playerIndex}
                                    size="3"
                                    placeholder={`선수 ${playerIndex + 1}명`}
                                    value={
                                      scoreForm[`${teamKey}Sets`][setIndex]?.players?.[
                                        playerIndex
                                      ] || ''
                                    }
                                    onChange={(e) =>
                                      updatePlayerName(
                                        teamKey,
                                        setIndex,
                                        playerIndex,
                                        e.target.value,
                                      )
                                    }
                                    style={{ flex: 1 }}
                                  />
                                ))}
                              </Flex>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </Box>
                ))}

                {/* 세트 삭제 버튼 (1세트가 아닌 경우에만) */}
                {setIndex > 0 && (
                  <Flex justify="end" mt="3">
                    <Button size="2" variant="soft" color="red" onClick={() => removeSet(setIndex)}>
                      세트 삭제
                    </Button>
                  </Flex>
                )}
              </Box>
            ))}

            {/* 세트 추가 버튼 */}
            {scoreForm.team1Sets.length < 5 && (
              <Flex justify="center">
                <Button size="2" variant="soft" onClick={addSet}>
                  세트 추가
                </Button>
              </Flex>
            )}

            {/* 경기 상태 및 코트 */}
            <Flex align="center" gap="3">
              <Text size="3">경기상태</Text>
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
                <Select.Trigger style={{ width: '120px' }} />
                <Select.Content>
                  {STATUS_OPTIONS.map((option) => (
                    <Select.Item key={option.value} value={option.value}>
                      {option.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
              <Text>코트</Text>
              <TextField.Root
                size="3"
                placeholder="코트 번호"
                value={scoreForm.court}
                onChange={(e) => setScoreForm((prev) => ({ ...prev, court: e.target.value }))}
                style={{ width: '120px' }}
              />
            </Flex>
          </Flex>

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button size="3" variant="soft">
                취소
              </Button>
            </Dialog.Close>
            <Button
              size="3"
              onClick={() => {
                if (selectedMatch) {
                  handleSaveScore();
                }
              }}
            >
              저장
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      {/* 라운드 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        title={`${ROUND_NAME_MAP[round]} 라운드 삭제 확인`}
        description={`${ROUND_NAME_MAP[round]} 라운드와 모든 경기 정보를 삭제하시겠습니까? 삭제된 데이터는 복구할 수 없습니다.`}
        confirmText="삭제"
        cancelText="취소"
        confirmColor="red"
        open={showDeleteRoundDialog}
        onOpenChange={setShowDeleteRoundDialog}
        onConfirm={handleDeleteCurrentRound}
      />

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
