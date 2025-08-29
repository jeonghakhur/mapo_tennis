'use client';

import { useState, useEffect, useCallback } from 'react';
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
  const [selectedMatch, setSelectedMatch] = useState<BracketMatch | null>(null);
  const [showScoreDialog, setShowScoreDialog] = useState(false);
  const [scoreForm, setScoreForm] = useState({
    team1Score: '',
    team2Score: '',
    status: 'scheduled' as 'scheduled' | 'in_progress' | 'completed' | 'cancelled',
    court: '',
  });
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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

  // 경기 상태 옵션
  const statusOptions = [
    { value: 'scheduled', label: '예정' },
    { value: 'in_progress', label: '진행중' },
    { value: 'completed', label: '완료' },
    { value: 'cancelled', label: '취소' },
  ];

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

  // 점수 저장
  const handleSaveScore = async () => {
    if (!selectedMatch) return;

    return withLoading(async () => {
      const response = await fetch('/api/tournament-grouping/bracket/score', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId: selectedTournament,
          division: selectedDivision,
          matchId: selectedMatch._id,
          team1Score: parseInt(scoreForm.team1Score) || 0,
          team2Score: parseInt(scoreForm.team2Score) || 0,
          status: scoreForm.status,
          court: scoreForm.court,
        }),
      });

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
                      <Button size="1" variant="soft" onClick={() => openScoreDialog(match)} mt="2">
                        점수 입력
                      </Button>
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

      {/* 점수 입력 다이얼로그 */}
      <Dialog.Root open={showScoreDialog} onOpenChange={setShowScoreDialog}>
        <Dialog.Content>
          <Dialog.Title>경기 점수 입력</Dialog.Title>
          <Dialog.Description>
            {selectedMatch?.team1.teamName} vs {selectedMatch?.team2.teamName}
          </Dialog.Description>

          <Flex direction="column" gap="3" my="4">
            <Box>
              <Text size="2" weight="bold" mb="1">
                {selectedMatch?.team1.teamName} 점수
              </Text>
              <TextField.Root
                size="2"
                type="number"
                value={scoreForm.team1Score}
                onChange={(e) => setScoreForm((prev) => ({ ...prev, team1Score: e.target.value }))}
                placeholder="0"
              />
            </Box>
            <Box>
              <Text size="2" weight="bold" mb="1">
                {selectedMatch?.team2.teamName} 점수
              </Text>
              <TextField.Root
                size="2"
                type="number"
                value={scoreForm.team2Score}
                onChange={(e) => setScoreForm((prev) => ({ ...prev, team2Score: e.target.value }))}
                placeholder="0"
              />
            </Box>
            <Box>
              <Text size="2" weight="bold" mb="1">
                경기 상태
              </Text>
              <Select.Root
                size="2"
                value={scoreForm.status}
                onValueChange={(value: 'scheduled' | 'in_progress' | 'completed' | 'cancelled') =>
                  setScoreForm((prev) => ({ ...prev, status: value }))
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
              <Text size="2" weight="bold" mb="1">
                코트
              </Text>
              <TextField.Root
                size="2"
                value={scoreForm.court}
                onChange={(e) => setScoreForm((prev) => ({ ...prev, court: e.target.value }))}
                placeholder="코트 번호"
              />
            </Box>
          </Flex>

          <Flex gap="3" justify="end">
            <Dialog.Close>
              <Button size="2" variant="soft">
                취소
              </Button>
            </Dialog.Close>
            <Button size="2" color="green" onClick={handleSaveScore}>
              저장
            </Button>
          </Flex>
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
    </Container>
  );
}
