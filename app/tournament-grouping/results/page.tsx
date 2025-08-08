'use client';

import { useState, useEffect } from 'react';
import { Box, Text, Button, Flex, Card, Heading, Badge, Separator } from '@radix-ui/themes';
import { useLoading } from '@/hooks/useLoading';

import type { Group, Match } from '@/types/tournament';
import Container from '@/components/Container';
import ConfirmDialog from '@/components/ConfirmDialog';

interface GroupingResult {
  groups: Group[];
  totalGroups: number;
  teamsPerGroup: number;
  remainingTeams: number;
  distribution: {
    groupsWith3Teams: number;
    groupsWith2Teams: number;
  };
}

export default function TournamentGroupingResultsPage() {
  const { loading, withLoading } = useLoading();

  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [groupingResult, setGroupingResult] = useState<GroupingResult | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);
  const [showCreateMatchesDialog, setShowCreateMatchesDialog] = useState(false);

  // URL 파라미터에서 초기값 설정
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tournamentId = urlParams.get('tournamentId');
    const division = urlParams.get('division');

    if (tournamentId) setSelectedTournament(tournamentId);
    if (division) setSelectedDivision(division);
  }, []);

  // 조편성 결과 조회
  const fetchGroupingResults = async () => {
    if (!selectedTournament || !selectedDivision) return;

    return withLoading(async () => {
      // 조 정보 조회
      const groupsResponse = await fetch(
        `/api/tournament-grouping/groups?tournamentId=${selectedTournament}&division=${selectedDivision}`,
      );

      if (groupsResponse.ok) {
        const groupsData = await groupsResponse.json();
        setGroupingResult(groupsData);
      }

      // 경기 정보 조회
      const matchesResponse = await fetch(
        `/api/tournament-grouping/matches?tournamentId=${selectedTournament}&division=${selectedDivision}`,
      );

      if (matchesResponse.ok) {
        const matchesData = await matchesResponse.json();
        setMatches(matchesData);
      }
    });
  };

  // 조 삭제 실행
  const handleDeleteGroup = async () => {
    if (!groupToDelete || !selectedTournament || !selectedDivision) return;

    await withLoading(async () => {
      const response = await fetch(`/api/tournament-grouping/groups/${groupToDelete}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tournamentId: selectedTournament,
          division: selectedDivision,
        }),
      });

      if (response.ok) {
        // 삭제 후 결과 다시 조회
        await fetchGroupingResults();
        setShowDeleteDialog(false);
        setGroupToDelete(null);
      }
    });
  };

  // 대회 또는 부서 변경 시 결과 조회
  useEffect(() => {
    if (selectedTournament && selectedDivision) {
      fetchGroupingResults();
    }
  }, [selectedTournament, selectedDivision]);

  // 예선 경기 생성
  const handleCreateMatches = async () => {
    if (!selectedTournament || !selectedDivision) return;

    await withLoading(async () => {
      const response = await fetch('/api/tournament-grouping', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId: selectedTournament,
          division: selectedDivision,
        }),
      });

      if (response.ok) {
        setShowCreateMatchesDialog(false);
        // 최신 경기 목록 갱신
        await fetchGroupingResults();
      }
    });
  };

  return (
    <Container>
      {/* 조편성 결과 */}
      {groupingResult && (
        <Box>
          {/* 예선 경기 생성 버튼 */}
          <Flex justify="end" mb="3">
            <Button size="2" onClick={() => setShowCreateMatchesDialog(true)}>
              예선 경기 생성/재생성
            </Button>
          </Flex>

          <Flex direction="column" gap="4" mb="4">
            <Box>
              <Text size="3" weight="bold">
                총 조 수: {groupingResult.totalGroups}조
              </Text>
            </Box>
            <Box>
              <Text size="3" weight="bold">
                분배: {groupingResult.distribution.groupsWith3Teams}개 조(3팀) +{' '}
                {groupingResult.distribution.groupsWith2Teams}개 조(2팀)
              </Text>
            </Box>
          </Flex>

          {/* 조별 팀 목록 */}
          <Box>
            <Text size="3" weight="bold" mb="3">
              조별 팀 목록
            </Text>
            <Flex direction="column" gap="3">
              {groupingResult.groups.map((group) => (
                <Card key={group.groupId}>
                  <Flex align="center" justify="between" mb="2">
                    <Text size="3" weight="bold">
                      {group.name}
                    </Text>
                    <Badge color="blue">{group.teams.length}팀</Badge>
                  </Flex>

                  <Flex direction="column" gap="2">
                    {group.teams.map((team, index) => (
                      <Box key={team._id}>
                        <Flex align="center" justify="between">
                          <Text weight="bold" style={{ wordBreak: 'break-word', flex: '1' }}>
                            {team.name}
                          </Text>
                          <Badge color="green">{team.seed || '시드 없음'}</Badge>
                        </Flex>
                        {index !== group.teams.length - 1 && <Separator mt="2" size="4" />}
                      </Box>
                    ))}
                  </Flex>
                </Card>
              ))}
            </Flex>
          </Box>
        </Box>
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
                    <th className="p-3 text-left border-b">상태</th>
                    <th className="p-3 text-left border-b">코트</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.map((match) => (
                    <tr key={match._id} className="border-b hover:bg-gray-50">
                      <td className="p-3">{match.matchNumber}경기</td>
                      <td className="p-3">{match.groupId || '-'}</td>
                      <td className="p-3">{match.team1.teamName}</td>
                      <td className="p-3">{match.team2.teamName}</td>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Box>
        </Card>
      )}

      {/* 데이터가 없을 때 */}
      {selectedTournament && selectedDivision && !groupingResult && !loading && (
        <Card>
          <Box p="4">
            <Text size="3" color="gray" align="center">
              해당 대회와 부서에 대한 조편성 결과가 없습니다.
            </Text>
          </Box>
        </Card>
      )}

      {/* 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="조 삭제 확인"
        description="이 조를 삭제하시겠습니까? 삭제된 조는 복구할 수 없습니다."
        onConfirm={handleDeleteGroup}
        confirmText="삭제"
        cancelText="취소"
        confirmColor="red"
      />

      {/* 예선 경기 생성 확인 다이얼로그 */}
      <ConfirmDialog
        open={showCreateMatchesDialog}
        onOpenChange={setShowCreateMatchesDialog}
        title="예선 경기 생성"
        description="현재 조편성 기준으로 예선 경기를 생성/재생성합니다. 진행 중인 경기가 있다면 재생성하지 마세요. 진행하시겠습니까?"
        onConfirm={handleCreateMatches}
        confirmText="생성"
        cancelText="취소"
        confirmColor="green"
      />
    </Container>
  );
}
