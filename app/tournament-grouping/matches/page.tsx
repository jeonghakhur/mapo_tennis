'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSession } from 'next-auth/react';
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
  Dialog,
} from '@radix-ui/themes';
import { useLoading } from '@/hooks/useLoading';
import { useTournament } from '@/hooks/useTournaments';
import { useMatches } from '@/hooks/useMatches';
import ConfirmDialog from '@/components/ConfirmDialog';
import type { Match, SetScore, MatchUpdateData } from '@/types/tournament';
import Container from '@/components/Container';
import { useUser } from '@/hooks/useUser';
import { isAdmin } from '@/lib/authUtils';

function TournamentMatchesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { user } = useUser(session?.user?.email);
  const { withLoading } = useLoading();

  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [showScoreDialog, setShowScoreDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [scoreForm, setScoreForm] = useState({
    team1Sets: [] as SetScore[],
    team2Sets: [] as SetScore[],
    status: 'scheduled' as 'scheduled' | 'in_progress' | 'completed' | 'cancelled',
    court: '',
  });

  // 관리자 권한 확인
  const admin = isAdmin(user);

  // SWR 훅들 사용
  const { tournament } = useTournament(selectedTournament || '');

  const { matches, mutate: mutateMatches } = useMatches(
    selectedTournament || null,
    selectedDivision || null,
  );

  // 대회 유형 확인 (개인전/단체전)
  const isTeamTournament = tournament?.tournamentType === 'team';

  // 본선 대진표 존재 여부 확인
  const [hasBracket, setHasBracket] = useState(false);

  // 모든 예선 경기 완료 여부 확인
  const allMatchesCompleted =
    matches.length > 0 && matches.every((match) => match.status === 'completed');

  // 본선 대진표 확인
  const checkBracket = useCallback(async () => {
    if (!selectedTournament || !selectedDivision) return;

    try {
      console.log('본선 대진표 확인 중:', { selectedTournament, selectedDivision });
      const response = await fetch(
        `/api/tournament-grouping/bracket?tournamentId=${selectedTournament}&division=${selectedDivision}`,
      );

      console.log('본선 대진표 API 응답 상태:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('본선 대진표 API 응답 데이터:', data);

        // 응답 구조에 따라 수정
        const hasMatches = data.matches && Array.isArray(data.matches) && data.matches.length > 0;
        console.log('본선 대진표 존재 여부:', hasMatches);

        setHasBracket(hasMatches);
      } else {
        console.log('본선 대진표 API 오류:', response.status);
        setHasBracket(false);
      }
    } catch (error) {
      console.error('본선 대진표 확인 오류:', error);
      setHasBracket(false);
    }
  }, [selectedTournament, selectedDivision]);

  // 대회 또는 부서 변경 시 본선 대진표 확인
  useEffect(() => {
    checkBracket();
  }, [checkBracket]);

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

  // 세트 점수 추가
  const addSet = () => {
    const currentTeam1Sets = scoreForm.team1Sets;
    const currentTeam2Sets = scoreForm.team2Sets;
    const newSetNumber = Math.max(currentTeam1Sets.length, currentTeam2Sets.length) + 1;

    if (newSetNumber > 5) return; // 최대 5세트

    // 고유한 _key 생성
    const setKey = `set-${newSetNumber}-${Date.now()}`;

    // 선수 이름 추출
    const team1Players = selectedMatch
      ? extractPlayerNames(selectedMatch.team1.teamName)
      : ['', ''];
    const team2Players = selectedMatch
      ? extractPlayerNames(selectedMatch.team2.teamName)
      : ['', ''];

    const newSet: SetScore = {
      _key: setKey,
      setNumber: newSetNumber,
      games: 0,
      players: isTeamTournament
        ? ['', ''] // 단체전: 빈 문자열 2개
        : team1Players, // 개인전: 추출된 선수 이름
    };

    const newSet2: SetScore = {
      _key: setKey,
      setNumber: newSetNumber,
      games: 0,
      players: isTeamTournament
        ? ['', ''] // 단체전: 빈 문자열 2개
        : team2Players, // 개인전: 추출된 선수 이름
    };
    console.log('newSet', scoreForm);
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
  const calculateSetsWon = (
    team1Sets: SetScore[],
    team2Sets: SetScore[],
  ): { team1: number; team2: number } => {
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
  };

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
      });
    },
    [withLoading, mutateMatches],
  );

  // 모든 경기에 랜덤 점수 자동 입력
  const handleAutoScoreAllMatches = useCallback(async () => {
    return withLoading(async () => {
      console.log('모든 경기에 랜덤 점수 자동 입력 시작');

      // 점수가 입력되지 않은 경기들만 필터링
      const matchesToUpdate = matches.filter(
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

      // 각 경기에 대해 랜덤 세트 점수 생성 및 업데이트
      const updatePromises = matchesToUpdate.map(async (match) => {
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
            players: isTeamTournament ? ['', ''] : team1Players,
          });
          team2Sets.push({
            _key: setKey,
            setNumber: i,
            games: team2Games,
            players: isTeamTournament ? ['', ''] : team2Players,
          });
        }

        const matchData: MatchUpdateData = {
          team1Sets,
          team2Sets,
          status: 'completed',
          court: match.court || '1',
        };

        console.log(`경기 ${match.matchNumber} 세트 점수 입력:`, { team1Sets, team2Sets });

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
      } catch (error) {
        console.error('자동 점수 입력 오류:', error);
        setSuccessMessage(
          `오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        );
        setShowSuccessDialog(true);
      }
    });
  }, [withLoading, matches, mutateMatches, isTeamTournament, extractPlayerNames]);

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

    // 기본적으로 1세트가 있도록 설정
    const team1Players = extractPlayerNames(match.team1.teamName);
    const team2Players = extractPlayerNames(match.team2.teamName);

    const team1Sets =
      match.team1.sets && match.team1.sets.length > 0
        ? match.team1.sets.map((set, index) => ({
            ...set,
            _key: set._key || `existing-set-${index}-${Date.now()}`,
            // 선수명이 없으면 기본값 설정
            players:
              set.players && set.players.length > 0
                ? set.players
                : isTeamTournament
                  ? ['', ''] // 단체전: 빈 문자열 2개
                  : [match.team1.teamName, ''], // 개인전: 팀명과 빈 문자열
          }))
        : [
            {
              _key: `set-1-${Date.now()}`,
              setNumber: 1,
              games: 0,
              players: isTeamTournament
                ? ['', ''] // 단체전: 빈 문자열 2개
                : team1Players, // 개인전: 추출된 선수 이름
            },
          ];

    const team2Sets =
      match.team2.sets && match.team2.sets.length > 0
        ? match.team2.sets.map((set, index) => ({
            ...set,
            _key: set._key || `existing-set-${index}-${Date.now()}`,
            // 선수명이 없으면 기본값 설정
            players:
              set.players && set.players.length > 0
                ? set.players
                : isTeamTournament
                  ? ['', ''] // 단체전: 빈 문자열 2개
                  : [match.team2.teamName, ''], // 개인전: 팀명과 빈 문자열
          }))
        : [
            {
              _key: `set-1-${Date.now()}`,
              setNumber: 1,
              games: 0,
              players: isTeamTournament
                ? ['', ''] // 단체전: 빈 문자열 2개
                : team2Players, // 개인전: 추출된 선수 이름
            },
          ];

    setScoreForm({
      team1Sets,
      team2Sets,
      status: match.status,
      court: match.court || '',
    });
    setShowScoreDialog(true);
  };

  // 세트 점수 표시 함수
  const renderSetScores = (match: Match) => {
    if (!match.team1.sets || !match.team2.sets || match.team1.sets.length === 0) {
      return <span className="text-gray-400">- - -</span>;
    }

    const maxSets = Math.max(match.team1.sets.length, match.team2.sets.length);
    const scores = [];

    for (let i = 0; i < maxSets; i++) {
      const team1Games = match.team1.sets[i]?.games || 0;
      const team2Games = match.team2.sets[i]?.games || 0;
      const team1Tiebreak = match.team1.sets[i]?.tiebreak;
      const team2Tiebreak = match.team2.sets[i]?.tiebreak;

      let setScore = `${team1Games}-${team2Games}`;
      if (team1Tiebreak !== undefined && team2Tiebreak !== undefined) {
        setScore += `(${team1Tiebreak}-${team2Tiebreak})`;
      }

      scores.push(
        <span key={i} className="text-sm">
          {setScore}
        </span>,
      );
    }

    return <div className="flex gap-1">{scores}</div>;
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
        </Flex>
        <Flex gap="2" mt="2">
          {admin && (
            <Button size="3" color="orange" onClick={handleAutoScoreAllMatches}>
              점수자동입력
            </Button>
          )}
          {hasBracket && (
            <Button size="3" color="blue" onClick={handleViewBracket}>
              본선대진표보기
            </Button>
          )}
          {allMatchesCompleted && (
            <Button size="3" color="purple" onClick={handleCreateBracket}>
              예선결과보기
            </Button>
          )}
        </Flex>
      </Box>

      {/* 경기 목록 */}
      {matches.length > 0 && (
        <Box>
          <Flex align="center" justify="between" mb="4">
            <Heading size="4" weight="bold">
              경기 목록
            </Heading>
          </Flex>

          <div className="table-view text-center">
            <table>
              <thead>
                <tr>
                  <th>경기 번호</th>
                  <th>조</th>
                  <th>팀 1</th>
                  <th>팀 2</th>
                  <th>세트 점수</th>
                  <th>상태</th>
                  <th>코트</th>
                  <th>액션</th>
                </tr>
              </thead>
              <tbody>
                {matches
                  .sort((a, b) => {
                    const aGroupName = a.groupId || '';
                    const bGroupName = b.groupId || '';
                    if (aGroupName !== bGroupName) {
                      return aGroupName.localeCompare(bGroupName);
                    }
                    return (a.matchNumber || 0) - (b.matchNumber || 0);
                  })
                  .map((match) => {
                    const setsWon = calculateSetsWon(
                      match.team1.sets || [],
                      match.team2.sets || [],
                    );
                    return (
                      <tr
                        key={match._id || `match-${match.matchNumber}-${match.team1.teamId}`}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="p-3">{match.matchNumber}경기</td>
                        <td className="p-3">{match.groupId || '-'}</td>
                        <td className="p-3">
                          <span
                            className={
                              setsWon.team1 > setsWon.team2
                                ? 'font-bold text-green-600'
                                : setsWon.team1 < setsWon.team2
                                  ? 'text-gray-500'
                                  : ''
                            }
                          >
                            {match.team1.teamName}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={
                              setsWon.team2 > setsWon.team1
                                ? 'font-bold text-green-600'
                                : setsWon.team2 < setsWon.team1
                                  ? 'text-gray-500'
                                  : ''
                            }
                          >
                            {match.team2.teamName}
                          </span>
                        </td>
                        <td className="p-3">{renderSetScores(match)}</td>
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
                    );
                  })}
              </tbody>
            </table>
          </div>
        </Box>
      )}
      {/* 점수 입력 다이얼로그 */}
      <Dialog.Root open={showScoreDialog} onOpenChange={setShowScoreDialog}>
        <Dialog.Content style={{ width: '100%' }}>
          <Dialog.Title>
            {selectedMatch && (
              <>
                {selectedMatch.groupId || '-'} • {selectedMatch.matchNumber}경기
              </>
            )}
          </Dialog.Title>
          <Flex mb="4" gap="2" direction="column">
            <Text className="text-blue-600">팀1: {selectedMatch?.team1?.teamName}</Text>
            <Text className="text-green-600">팀2: {selectedMatch?.team2?.teamName}</Text>
          </Flex>

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
                      {tournament?.tournamentType === 'team' && teamName}
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
                  {statusOptions.map((option) => (
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
                  const setsWon = calculateSetsWon(scoreForm.team1Sets, scoreForm.team2Sets);
                  console.log(setsWon);

                  // 승자 결정
                  let winner = undefined;
                  if (setsWon.team1 > setsWon.team2) {
                    winner = selectedMatch.team1.teamId;
                  } else if (setsWon.team2 > setsWon.team1) {
                    winner = selectedMatch.team2.teamId;
                  }

                  handleUpdateMatch(selectedMatch._id, {
                    team1Sets: scoreForm.team1Sets,
                    team2Sets: scoreForm.team2Sets,
                    team1TotalSetsWon: setsWon.team1,
                    team2TotalSetsWon: setsWon.team2,
                    winner,
                    status: scoreForm.status,
                    court: scoreForm.court,
                  });
                }
              }}
            >
              저장
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
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

export default function TournamentMatchesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TournamentMatchesContent />
    </Suspense>
  );
}
