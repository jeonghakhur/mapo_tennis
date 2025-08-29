'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { Box, Text, Button, Flex, Card, Badge, Separator } from '@radix-ui/themes';
import { useLoading } from '@/hooks/useLoading';
import { useRouter, useSearchParams } from 'next/navigation';
import { mutate } from 'swr';

import type { Group } from '@/types/tournament';
import Container from '@/components/Container';
import ConfirmDialog from '@/components/ConfirmDialog';
import LoadingOverlay from '@/components/LoadingOverlay';
import { useUser } from '@/hooks/useUser';
import { isAdmin } from '@/lib/authUtils';

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

function TournamentGroupingResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { user } = useUser(session?.user?.email);
  const { loading, withLoading } = useLoading();

  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [groupingResult, setGroupingResult] = useState<GroupingResult | null>(null);
  const [hasMatches, setHasMatches] = useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCreateMatchesDialog, setShowCreateMatchesDialog] = useState(false);

  // 관리자 권한 확인
  const admin = isAdmin(user);

  // URL 파라미터에서 초기값 설정
  useEffect(() => {
    const tournamentId = searchParams.get('tournamentId');
    const division = searchParams.get('division');

    if (tournamentId) setSelectedTournament(tournamentId);
    if (division) setSelectedDivision(division);
  }, [searchParams]);

  // 경기 정보 조회
  const fetchMatchesInfo = useCallback(async () => {
    if (!selectedTournament || !selectedDivision) return;

    try {
      const matchesResponse = await fetch(
        `/api/tournament-grouping/matches?tournamentId=${selectedTournament}&division=${selectedDivision}`,
      );

      if (matchesResponse.ok) {
        const matchesData = await matchesResponse.json();
        setHasMatches(matchesData.length > 0);
      } else {
        setHasMatches(false);
      }
    } catch (error) {
      console.error('경기 정보 조회 오류:', error);
      setHasMatches(false);
    }
  }, [selectedTournament, selectedDivision]);

  // 조편성 결과 조회
  const fetchGroupingResults = useCallback(async () => {
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
      await fetchMatchesInfo();
    });
  }, [selectedTournament, selectedDivision, withLoading, fetchMatchesInfo]);

  // 대진표 삭제 실행
  const handleDeleteAll = async () => {
    if (!selectedTournament || !selectedDivision) return;

    await withLoading(async () => {
      const response = await fetch('/api/tournament-grouping/delete-all', {
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
        // 1) SWR 관련 키들 전부 무효화 (키가 불확실할 때)
        await mutate(
          (key) => typeof key === 'string' && key.startsWith('/api/tournament-grouping'),
          undefined,
          false,
        );

        // 2) (옵션) 이동할 페이지 프리패치
        router.prefetch('/tournament-grouping');

        // 3) 이동 + 즉시 재요청
        router.push('/tournament-grouping');
        router.refresh();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || '삭제 중 오류가 발생했습니다.');
      }
    });
  };

  // 대회 또는 부서 변경 시 결과 조회
  useEffect(() => {
    if (selectedTournament && selectedDivision) {
      fetchGroupingResults();
    }
  }, [selectedTournament, selectedDivision, fetchGroupingResults]);

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
        // 경기 정보 다시 조회
        await fetchMatchesInfo();
        // 예선 경기 상세 페이지로 이동
        router.push(
          `/tournament-grouping/matches?tournamentId=${selectedTournament}&division=${selectedDivision}`,
        );
      }
    });
  };

  return (
    <Container>
      {/* 조편성 결과 */}
      {loading && <LoadingOverlay />}
      {groupingResult && (
        <Box>
          {/* 예선 경기 관련 버튼 */}
          <Flex justify="end" gap="2" mb="3">
            {hasMatches ? (
              <Button
                size="3"
                onClick={() =>
                  router.push(
                    `/tournament-grouping/matches?tournamentId=${selectedTournament}&division=${selectedDivision}`,
                  )
                }
              >
                예선경기상세
              </Button>
            ) : (
              <Button size="3" onClick={() => setShowCreateMatchesDialog(true)}>
                예선경기생성
              </Button>
            )}
            {admin && (
              <Button size="3" color="red" variant="soft" onClick={() => setShowDeleteDialog(true)}>
                대진표삭제
              </Button>
            )}
          </Flex>

          <Flex direction="column" gap="4" mb="4">
            <Text size="3" weight="bold">
              총 조 수: {groupingResult.totalGroups}조
            </Text>
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
        title="대진표 삭제 확인"
        description="조편성과 모든 경기 정보를 삭제하시겠습니까? 삭제된 데이터는 복구할 수 없습니다."
        onConfirm={handleDeleteAll}
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

export default function TournamentGroupingResultsPage() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <TournamentGroupingResultsContent />
    </Suspense>
  );
}
