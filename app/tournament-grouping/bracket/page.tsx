'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { Box, Text, Button, Flex, Card, Heading, Badge } from '@radix-ui/themes';
import { useRouter, useSearchParams } from 'next/navigation';

import { useLoading } from '@/hooks/useLoading';
import { useTournament } from '@/hooks/useTournaments';
import { useUser } from '@/hooks/useUser';
import { isAdmin } from '@/lib/authUtils';
import { useStandings } from '@/hooks/useStandings';
import { useGroups } from '@/hooks/useGroups';
import { useMatches } from '@/hooks/useMatches';

interface GroupStanding {
  teamId: string;
  teamName: string;
  groupId?: string;
  position: number;
  points: number;
  goalDifference: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
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
  const [bracketMatches, setBracketMatches] = useState<BracketMatch[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showStandings, setShowStandings] = useState(true);

  // 관리자 권한 확인
  const admin = isAdmin(user);

  // SWR 훅 사용
  const { tournament } = useTournament(selectedTournament || '');
  const { standings } = useStandings(selectedTournament || null, selectedDivision || null);
  const { groupNameMap } = useGroups(selectedTournament || null, selectedDivision || null);
  const { matches } = useMatches(selectedTournament || null, selectedDivision || null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchBracket]);

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

  // 본선 대진표 삭제
  const deleteBracket = async () => {
    await withLoading(async () => {
      const response = await fetch('/api/tournament-grouping/bracket/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId: selectedTournament,
          division: selectedDivision,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '본선 대진표 삭제에 실패했습니다.');
      }

      // 데이터 새로고침
      await fetchBracket();
      setShowDeleteDialog(false);
      setShowSuccessDialog(true);
    });
  };

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
          {bracketMatches.length === 0 && qualifiedTeams.length > 0 && admin && (
            <Button size="3" onClick={() => setShowCreateDialog(true)}>
              본선대진표생성
            </Button>
          )}
          {bracketMatches.length > 0 && admin && (
            <Button size="3" color="red" onClick={() => setShowDeleteDialog(true)}>
              본선대진표삭제
            </Button>
          )}
        </Flex>
      </Box>

      {/* 조별 순위 */}
      {standings.length > 0 && (
        <Box mb="6">
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
                // standings 데이터에 이미 groupId가 포함되어 있으므로 직접 사용
                const groupId = standing.groupId || 'unknown';

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
                    <div className="table-view">
                      <table className="text-center">
                        <colgroup>
                          <col style={{ width: '50px' }} />
                          <col />
                          <col style={{ width: '50px' }} />
                          <col style={{ width: '50px' }} />
                          <col style={{ width: '50px' }} />
                          <col style={{ width: '50px' }} />
                          <col style={{ width: '50px' }} />
                          <col style={{ width: '50px' }} />
                          <col style={{ width: '50px' }} />
                          <col style={{ width: '50px' }} />
                        </colgroup>
                        <thead className="bg-gray-50">
                          <tr>
                            <th>순위</th>
                            <th>팀명</th>
                            <th>경기</th>
                            <th>승</th>
                            <th>무</th>
                            <th>패</th>
                            <th>득점</th>
                            <th>실점</th>
                            <th>득실차</th>
                            <th>승점</th>
                          </tr>
                        </thead>
                        <tbody>
                          {groupStandings.map((standing) => (
                            <tr key={standing.teamId} className="border-b hover:bg-gray-50">
                              <td>{standing.position}</td>
                              <td className="text-left">{standing.teamName}</td>
                              <td>{standing.played}</td>
                              <td>{standing.won}</td>
                              <td>{standing.drawn}</td>
                              <td>{standing.lost}</td>
                              <td>{standing.goalsFor}</td>
                              <td>{standing.goalsAgainst}</td>
                              <td>{standing.goalDifference}</td>
                              <td>{standing.points}</td>
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

      {/* 진출팀 목록 */}
      {qualifiedTeams.length > 0 && (
        <Box>
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
                      {team.groupId ? team.groupId.replace('group_', '').toUpperCase() + '조' : '-'}
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
      )}

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

      {/* 본선 대진표 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        title="본선 대진표 삭제"
        description="본선 대진표를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmText="삭제"
        cancelText="취소"
        confirmColor="red"
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={deleteBracket}
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
        title="작업 완료"
        description="본선 대진표 작업이 성공적으로 완료되었습니다."
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
