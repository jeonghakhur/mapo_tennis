'use client';

import { useState, useEffect, useCallback } from 'react';
import { Box, Text, Button, Flex, Card, Heading, Select, Badge } from '@radix-ui/themes';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useLoading } from '@/hooks/useLoading';
import { useTournamentsByUserLevel } from '@/hooks/useTournaments';
import { useUser } from '@/hooks/useUser';
import { isAdmin } from '@/lib/authUtils';
import ConfirmDialog from '@/components/ConfirmDialog';
import type { GroupingResult, Group, Team } from '@/types/tournament';
import Container from '@/components/Container';
import ManualGrouping from '@/components/ManualGrouping';

export default function NewTournamentGroupingPage() {
  const router = useRouter();
  const { status, data: session } = useSession();
  const { user } = useUser(session?.user?.email);
  const { loading, withLoading } = useLoading();

  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [teamsPerGroup, setTeamsPerGroup] = useState<2 | 3>(3);
  const [groupingResult, setGroupingResult] = useState<GroupingResult | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [approvedApplications, setApprovedApplications] = useState<number>(0);
  const [teams, setTeams] = useState<Team[]>([]);
  const [manualGroups, setManualGroups] = useState<Group[]>([]);
  const [existingGroupings, setExistingGroupings] = useState<
    Array<{ tournamentId: string; division: string }>
  >([]);
  const [showGroupingInterface, setShowGroupingInterface] = useState(false);

  // 권한 확인 후에만 대회 목록 조회
  const isUserAdmin = status === 'authenticated' && user && isAdmin(user);
  const { tournaments } = useTournamentsByUserLevel(isUserAdmin ? 5 : undefined);

  // 권한 확인: 관리자가 아니면 접근 거부
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/signin');
      return;
    }

    if (status === 'authenticated' && user && !isAdmin(user)) {
      router.replace('/access-denied');
      return;
    }
  }, [status, user, router]);

  // 기존 조편성 목록 조회 (관리자만)
  const fetchExistingGroupings = useCallback(async () => {
    if (!isUserAdmin) return; // 관리자가 아니면 조회하지 않음

    try {
      const response = await fetch('/api/tournament-grouping/index');
      if (response.ok) {
        const data = await response.json();
        const groupings = data.groupings || [];
        setExistingGroupings(
          groupings.map((g: { tournamentId: string; division: string }) => ({
            tournamentId: g.tournamentId,
            division: g.division,
          })),
        );
      }
    } catch (error) {
      console.error('기존 조편성 목록 조회 오류:', error);
    }
  }, [isUserAdmin]);

  // URL 파라미터에서 초기값 설정
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tournamentId = urlParams.get('tournamentId');
    const division = urlParams.get('division');

    if (tournamentId) setSelectedTournament(tournamentId);
    if (division) setSelectedDivision(division);
  }, []);

  // 컴포넌트 마운트 시 기존 조편성 목록 조회 (관리자만)
  useEffect(() => {
    fetchExistingGroupings();
  }, [fetchExistingGroupings]);

  // 대회가 변경될 때 선택된 부서가 이미 조편성이 있는지 확인하고 초기화
  useEffect(() => {
    if (selectedTournament && selectedDivision) {
      const hasExistingGrouping = existingGroupings.some(
        (g) => g.tournamentId === selectedTournament && g.division === selectedDivision,
      );
      if (hasExistingGrouping) {
        setSelectedDivision(''); // 이미 조편성이 있으면 부서 선택 초기화
      }
    }
  }, [selectedTournament, selectedDivision, existingGroupings]);

  // 부서 옵션
  const divisionOptions = [
    { value: 'master', label: '마스터부' },
    { value: 'challenger', label: '챌린저부' },
    { value: 'futures', label: '퓨처스부' },
    { value: 'forsythia', label: '개나리부' },
    { value: 'chrysanthemum', label: '국화부' },
  ];

  // 승인된 신청서 수 조회 (관리자만)
  const fetchApprovedApplications = useCallback(async () => {
    if (!isUserAdmin || !selectedTournament || !selectedDivision) return;

    try {
      const response = await fetch(
        `/api/tournament-applications?tournamentId=${selectedTournament}&division=${selectedDivision}&status=approved`,
      );
      if (response.ok) {
        const data = await response.json();
        setApprovedApplications(data.length);

        // 선택된 대회 정보 가져오기
        const selectedTournamentInfo = tournaments.find((t) => t._id === selectedTournament);
        const isIndividual = selectedTournamentInfo?.tournamentType === 'individual';

        // 팀 목록 생성
        const teamList: Team[] = data.map(
          (
            app: { _id: string; division: string; teamMembers: unknown[]; createdAt: string },
            index: number,
          ) => {
            // 개인전/단체전에 따라 팀 이름 생성
            let teamName: string;

            if (isIndividual) {
              // 개인전: 이름 뒤에 클럽명
              const memberNames =
                (app.teamMembers as { name: string; clubName?: string }[])
                  ?.map(
                    (member: { name: string; clubName?: string }) =>
                      `${member.name} (${member.clubName || '클럽명 없음'})`,
                  )
                  .join(', ') || '팀원 없음';
              teamName = memberNames;
            } else {
              // 단체전: 클럽명을 앞에 한 번만
              const members = app.teamMembers as { name: string; clubName?: string }[];
              if (members && members.length > 0) {
                const clubName = members[0].clubName || '클럽명 없음';
                const memberNames = members.map((member) => member.name).join(', ');
                teamName = `${clubName} - ${memberNames}`;
              } else {
                teamName = '팀원 없음';
              }
            }

            return {
              _id: app._id,
              name: teamName,
              division: app.division,
              members: app.teamMembers,
              seed: index + 1,
              createdAt: app.createdAt,
            };
          },
        );
        setTeams(teamList);
      }
    } catch (error) {
      console.error('승인된 신청서 수 조회 오류:', error);
    }
  }, [isUserAdmin, selectedTournament, selectedDivision, tournaments]);

  // 대회 또는 부서 변경 시 승인된 신청서 수 조회
  useEffect(() => {
    if (selectedTournament && selectedDivision) {
      fetchApprovedApplications();
      // 조편성 인터페이스 숨기기
      setShowGroupingInterface(false);
    }
  }, [selectedTournament, selectedDivision, fetchApprovedApplications]);

  // 조편성 생성
  const handleCreateGrouping = async () => {
    if (!selectedTournament || !selectedDivision) {
      alert('대회와 부서를 선택해주세요.');
      return;
    }

    if (approvedApplications === 0) {
      alert('승인된 신청서가 없습니다. 조편성을 생성할 수 없습니다.');
      return;
    }

    if (manualGroups.length === 0 || manualGroups.every((group) => group.teams.length === 0)) {
      alert('조편성을 먼저 완료해주세요.');
      return;
    }

    return withLoading(async () => {
      // 조편성 저장만 수행 (예선 경기는 결과 페이지에서 생성)
      const saveRes = await fetch('/api/tournament-grouping/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId: selectedTournament,
          division: selectedDivision,
          groups: manualGroups,
        }),
      });

      if (!saveRes.ok) {
        const errorData = await saveRes.json();
        throw new Error(errorData.error || '조편성 생성에 실패했습니다.');
      }

      const result = await saveRes.json();
      setGroupingResult(result.data);
      setSuccessMessage('조편성이 성공적으로 저장되었습니다.');
      setShowSuccessDialog(true);
    });
  };

  // 예선 경기 생성
  const handleCreateMatches = async () => {
    if (!selectedTournament || !selectedDivision) {
      alert('대회와 부서를 선택해주세요.');
      return;
    }

    return withLoading(async () => {
      const response = await fetch('/api/tournament-grouping', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId: selectedTournament,
          division: selectedDivision,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '경기 생성에 실패했습니다.');
      }

      setSuccessMessage('예선 경기가 성공적으로 생성되었습니다.');
      setShowSuccessDialog(true);
    });
  };

  // 로딩 중이거나 권한 확인 중인 경우
  if (status === 'loading' || (status === 'authenticated' && !user)) {
    return (
      <Container>
        <Box p="6" style={{ textAlign: 'center' }}>
          <Text size="3" color="gray">
            로딩 중...
          </Text>
        </Box>
      </Container>
    );
  }

  // 권한이 없는 경우 렌더링 중단
  if (status === 'authenticated' && user && !isAdmin(user)) {
    return null;
  }

  return (
    <Container>
      <Box mb="6">
        <Heading size="5" weight="bold" mb="2">
          대회 조편성
        </Heading>
        <Text size="3" color="gray">
          자동 배정된 조편성을 확인하고 드래그 앤 드롭으로 조정한 후 저장합니다.
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
                  {divisionOptions.map((option) => {
                    // 이미 조편성이 있는지 확인
                    const hasExistingGrouping = existingGroupings.some(
                      (g) => g.tournamentId === selectedTournament && g.division === option.value,
                    );

                    return (
                      <Select.Item
                        key={option.value}
                        value={option.value}
                        disabled={hasExistingGrouping}
                      >
                        {option.label}
                        {hasExistingGrouping && ' (이미 조편성됨)'}
                      </Select.Item>
                    );
                  })}
                </Select.Content>
              </Select.Root>
            </Box>

            {/* 승인된 신청서 수 표시 */}
            {selectedTournament && selectedDivision && (
              <Box>
                <Text size="3" weight="bold" mb="2">
                  승인된 신청서 수
                </Text>
                <Flex align="center" gap="2">
                  <Badge color={approvedApplications > 0 ? 'green' : 'red'} size="2">
                    {approvedApplications}개
                  </Badge>
                  <Text size="2" color="gray">
                    {approvedApplications > 0 ? '조편성 가능합니다.' : '승인된 신청서가 없습니다.'}
                  </Text>
                </Flex>
              </Box>
            )}
          </Flex>
        </Box>
      </Card>

      {/* 조편성 옵션 */}
      <Card mb="6">
        <Box p="4">
          <Heading size="4" weight="bold" mb="4">
            조편성 옵션
          </Heading>

          <Flex direction="column" gap="4">
            <Box>
              <Text size="3" weight="bold" mb="2">
                조당 팀 수
              </Text>
              <Select.Root
                size="3"
                value={teamsPerGroup.toString()}
                onValueChange={(value) => setTeamsPerGroup(parseInt(value) as 2 | 3)}
              >
                <Select.Trigger />
                <Select.Content>
                  <Select.Item value="2">2팀</Select.Item>
                  <Select.Item value="3">3팀</Select.Item>
                </Select.Content>
              </Select.Root>
            </Box>
          </Flex>
        </Box>
      </Card>

      {/* 조편성 생성 버튼 */}
      {selectedTournament &&
        selectedDivision &&
        approvedApplications > 0 &&
        !showGroupingInterface && (
          <Card mb="6">
            <Box p="4">
              <Heading size="4" weight="bold" mb="4">
                조편성 시작
              </Heading>
              <Text size="3" color="gray" mb="4">
                조당 팀 수를 선택하고 조편성을 시작하세요.
              </Text>
              <Button size="3" onClick={() => setShowGroupingInterface(true)} disabled={loading}>
                조편성 시작하기
              </Button>
            </Box>
          </Card>
        )}

      {/* 조편성 인터페이스 */}
      {showGroupingInterface && teams.length > 0 && (
        <Box>
          <ManualGrouping
            teams={teams}
            onGroupsChange={setManualGroups}
            teamsPerGroup={teamsPerGroup}
          />
        </Box>
      )}

      {/* 조편성 결과 */}
      {groupingResult && (
        <Card mb="6">
          <Box p="4">
            <Heading size="4" weight="bold" mb="4">
              조편성 결과
            </Heading>

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
                  <Card key={group.groupId} size="2">
                    <Box p="3">
                      <Flex align="center" justify="between" mb="2">
                        <Text size="3" weight="bold">
                          {group.name}
                        </Text>
                        <Badge color="blue">{group.teams.length}팀</Badge>
                      </Flex>
                      <Flex direction="column" gap="1">
                        {group.teams.map((team, index) => (
                          <Text key={team._id} size="2" style={{ wordBreak: 'break-word' }}>
                            {index + 1}. {team.name}
                          </Text>
                        ))}
                      </Flex>
                    </Box>
                  </Card>
                ))}
              </Flex>
            </Box>
          </Box>
        </Card>
      )}

      {/* 액션 버튼 */}
      {showGroupingInterface && (
        <Flex gap="3" mb="6">
          <Button
            size="3"
            onClick={handleCreateGrouping}
            disabled={
              loading || !selectedTournament || !selectedDivision || approvedApplications === 0
            }
          >
            조편성 저장
          </Button>
          <Button
            size="3"
            variant="soft"
            onClick={handleCreateMatches}
            disabled={loading || !selectedTournament || !selectedDivision || !groupingResult}
          >
            예선 경기 생성
          </Button>
        </Flex>
      )}

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
