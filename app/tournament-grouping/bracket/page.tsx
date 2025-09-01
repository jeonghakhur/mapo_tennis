'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { Box, Text, Button, Flex, Card, Heading, Badge } from '@radix-ui/themes';
import { useRouter, useSearchParams } from 'next/navigation';

import { useLoading } from '@/hooks/useLoading';
import { useTournament } from '@/hooks/useTournaments';
import { useUser } from '@/hooks/useUser';
import { isAdmin } from '@/lib/authUtils';

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

function TournamentBracketContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { user } = useUser(session?.user?.email);
  const { withLoading } = useLoading();

  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [standings, setStandings] = useState<GroupStanding[]>([]);
  const [bracketMatches, setBracketMatches] = useState<BracketMatch[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  // 관리자 권한 확인
  const admin = isAdmin(user);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      console.log('API 응답:', result);

      // 데이터 새로고침
      await fetchBracket();

      // API 응답에서 라운드 정보 추출하여 해당 페이지로 이동
      let round = 'round32'; // 기본값
      if (result.matches && result.matches.length > 0) {
        // 생성된 경기들에서 가장 첫 번째 라운드 찾기
        const firstMatch = result.matches[0];
        if (firstMatch && firstMatch.round) {
          round = firstMatch.round;
          console.log('API 응답에서 추출한 라운드:', round);
        }
      }

      console.log('본선 대진표 생성 완료,', round, '페이지로 이동');
      router.push(
        `/tournament-grouping/bracket/view/${round}?tournamentId=${selectedTournament}&division=${selectedDivision}`,
      );
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
    standingsByGroup.forEach((groupStandings) => {
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

  // 보기 페이지로 이동
  const handleViewBracket = () => {
    router.push(
      `/tournament-grouping/bracket/view?tournamentId=${selectedTournament}&division=${selectedDivision}`,
    );
  };

  return (
    <Container>
      <Box mb="6">
        <Box mb="2">
          <Heading size="5" weight="bold" mb="2">
            {tournament?.title || '대회 정보 로딩 중...'}
          </Heading>
          <Text size="3" color="gray">
            {divisionNameMap[selectedDivision] || selectedDivision} • 본선 대진표 관리
          </Text>
        </Box>
        <Flex gap="2">
          {bracketMatches.length > 0 && (
            <Button size="3" color="green" onClick={handleViewBracket}>
              대진표보기
            </Button>
          )}
          {qualifiedTeams.length > 0 && admin && (
            <Button size="3" onClick={() => setShowCreateDialog(true)}>
              본선 대진표 생성
            </Button>
          )}
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

      {/* 본선 대진표 생성 확인 다이얼로그 */}
      <ConfirmDialog
        title="본선 대진표 생성"
        description={`진출팀 ${qualifiedTeams.length}팀을 기반으로 본선 토너먼트 대진표를 생성하시겠습니까?`}
        confirmText="생성"
        cancelText="취소"
        confirmColor="green"
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onConfirm={createBracket}
      />

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
        description="본선 대진표가 성공적으로 생성되었습니다."
        confirmText="확인"
        confirmColor="green"
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        onConfirm={() => setShowSuccessDialog(false)}
      />
    </Container>
  );
}

export default function TournamentBracketPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TournamentBracketContent />
    </Suspense>
  );
}
