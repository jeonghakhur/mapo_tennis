'use client';

import { useState, useEffect, useCallback } from 'react';
import { Box, Text, Button, Flex, Heading, Select, Badge, TextField } from '@radix-ui/themes';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLoading } from '@/hooks/useLoading';
import { useTournamentsByUserLevel } from '@/hooks/useTournaments';
import { useUser } from '@/hooks/useUser';
import { isAdmin } from '@/lib/authUtils';
import ConfirmDialog from '@/components/ConfirmDialog';
import type { Group, Team } from '@/types/tournament';
import Container from '@/components/Container';
import ManualGrouping from '@/components/ManualGrouping';
import { wrapTextWithSpans } from '@/lib/utils';
import { mutate } from 'swr';

export default function NewTournamentGroupingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, data: session } = useSession();
  const { user } = useUser(session?.user?.email);
  const { loading, withLoading } = useLoading();

  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [teamsPerGroup, setTeamsPerGroup] = useState<2 | 3>(3);
  const [maxTeams, setMaxTeams] = useState<string>(''); // 최대 팀 수 입력
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [approvedApplications, setApprovedApplications] = useState<number>(0);
  const [allTeams, setAllTeams] = useState<Team[]>([]); // 모든 팀 목록
  const [teams, setTeams] = useState<Team[]>([]); // 필터링된 팀 목록
  const [manualGroups, setManualGroups] = useState<Group[]>([]);
  const [existingGroupings, setExistingGroupings] = useState<
    Array<{ tournamentId: string; division: string }>
  >([]);
  const [showGroupingInterface, setShowGroupingInterface] = useState(false);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');

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
    const tournamentId = searchParams.get('tournamentId');
    const division = searchParams.get('division');

    if (tournamentId) setSelectedTournament(tournamentId);
    if (division) setSelectedDivision(division);
  }, [searchParams]);

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
          (app: {
            _id: string;
            division: string;
            teamMembers: unknown[];
            createdAt: string;
            seed?: number;
          }) => {
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
              seed: app.seed,
              createdAt: app.createdAt,
            };
          },
        );
        setAllTeams(teamList); // 모든 팀 목록 저장
        setTeams(teamList); // 초기에는 모든 팀을 사용
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

  // 최대 팀 수가 변경될 때 팀 목록 필터링 (자동 적용 제거)
  // useEffect(() => {
  //   if (maxTeams && !isNaN(Number(maxTeams))) {
  //     const maxTeamCount = parseInt(maxTeams);
  //     const filteredTeams = allTeams.slice(0, maxTeamCount);
  //     setTeams(filteredTeams);
  //   } else {
  //     // 최대 팀 수가 입력되지 않았으면 모든 팀 사용
  //     setTeams(allTeams);
  //   }
  // }, [maxTeams, allTeams]);

  // 조편성 생성
  const handleCreateGrouping = async () => {
    if (!selectedTournament || !selectedDivision) {
      alert('대회와 부서를 선택해주세요.');
      return;
    }

    if (teams.length === 0) {
      alert('조편성할 팀이 없습니다.');
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

      setSuccessMessage('조편성이 성공적으로 저장되었습니다.');
      setShowSuccessDialog(true);

      // SWR 캐시 무효화
      await mutate('/api/tournament-grouping/index');
    });
  };

  // 조편성 시작
  const handleStartGrouping = () => {
    let teamsToUse: Team[];

    if (maxTeams && !isNaN(Number(maxTeams))) {
      const maxTeamCount = parseInt(maxTeams);
      if (maxTeamCount > approvedApplications) {
        setWarningMessage(
          `입력한 팀 수(${maxTeamCount}개)가 승인된 신청서 수(${approvedApplications}개)보다 많습니다. 모든 팀(${approvedApplications}개)으로 조편성을 진행하시겠습니까?`,
        );
        setShowWarningDialog(true);
        return;
      }
      // 최대 팀 수에 따라 팀 목록 필터링
      teamsToUse = allTeams.slice(0, maxTeamCount);
    } else {
      // 최대 팀 수가 입력되지 않았으면 모든 팀 사용
      teamsToUse = allTeams;
    }

    console.log('조편성 시작 - 팀 목록:', teamsToUse);

    // 조편성 인터페이스 표시 및 기존 조편성 결과 초기화
    setTeams([...teamsToUse]); // 새로운 배열 참조 생성
    setShowGroupingInterface(true);
    setManualGroups([]);
  };

  // 경고 다이얼로그 확인 시 조편성 시작
  const handleWarningConfirm = () => {
    setShowWarningDialog(false);
    // 모든 팀으로 조편성 진행
    console.log('경고 확인 - 모든 팀 사용:', allTeams);
    setTeams([...allTeams]); // 새로운 배열 참조 생성
    setShowGroupingInterface(true);
    setManualGroups([]);
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

      <Box className="table-form">
        <table>
          <tbody>
            <tr>
              <th>
                <Flex justify="between" align="center">
                  {wrapTextWithSpans('대회선택')}
                </Flex>
              </th>
              <td>
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
              </td>
            </tr>
            <tr>
              <th>
                <Flex justify="between" align="center">
                  {wrapTextWithSpans('부서선택')}
                </Flex>
              </th>
              <td>
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

                {/* 승인된 신청서 수 표시 */}
                {selectedTournament && selectedDivision && (
                  <Flex gap="1" align="center" mt="2">
                    <Badge color={approvedApplications > 0 ? 'green' : 'red'} size="2">
                      {approvedApplications}개팀
                    </Badge>
                    <Text size="2" color="gray">
                      {approvedApplications > 0
                        ? '조편성 가능합니다.'
                        : '승인된 신청서가 없습니다.'}
                    </Text>
                  </Flex>
                )}
              </td>
            </tr>
            <tr>
              <th>
                <Flex justify="between" align="center">
                  {wrapTextWithSpans('조당팀수')}
                </Flex>
              </th>
              <td>
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
              </td>
            </tr>
            <tr>
              <th>
                <Flex justify="between" align="center">
                  {wrapTextWithSpans('최대팀수')}
                </Flex>
                <Text size="2" color="gray">
                  (선택)
                </Text>
              </th>
              <td>
                <TextField.Root
                  size="3"
                  placeholder="예: 30 (비워두면 모든 팀 사용)"
                  value={maxTeams}
                  onChange={(e) => setMaxTeams(e.target.value)}
                />
                <Text size="2" color="gray" mt="1">
                  시드 순서대로 상위 팀들만 조편성에 사용합니다.
                </Text>
              </td>
            </tr>
          </tbody>
        </table>
      </Box>

      {/* 조편성 시작 버튼 */}
      {selectedTournament && selectedDivision && approvedApplications > 0 && (
        <Box my="4" className="btn-wrap">
          <Button size="3" onClick={handleStartGrouping} disabled={loading}>
            {showGroupingInterface ? '조편성 다시 시작하기' : '조편성 시작하기'}
          </Button>
        </Box>
      )}

      {/* 조편성 인터페이스 */}
      {showGroupingInterface && teams.length > 0 && (
        <Box>
          <ManualGrouping
            key={`${selectedTournament}-${selectedDivision}-${teams.length}-${maxTeams}`}
            teams={teams}
            onGroupsChange={setManualGroups}
            teamsPerGroup={teamsPerGroup}
          />
        </Box>
      )}

      {/* 액션 버튼 */}
      {showGroupingInterface && (
        <Box className="btn-wrap" mt="4">
          <Button
            size="3"
            onClick={handleCreateGrouping}
            disabled={loading || !selectedTournament || !selectedDivision || teams.length === 0}
          >
            조편성 저장
          </Button>
        </Box>
      )}

      {/* 성공 다이얼로그 */}
      <ConfirmDialog
        title="작업 완료"
        description={successMessage}
        confirmText="확인"
        confirmColor="green"
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        onConfirm={() => {
          setShowSuccessDialog(false);
          // 조편성 상세 페이지로 이동
          router.push(
            `/tournament-grouping/results?tournamentId=${selectedTournament}&division=${selectedDivision}`,
          );
        }}
      />

      {/* 경고 다이얼로그 */}
      <ConfirmDialog
        title="팀 수 경고"
        description={warningMessage}
        confirmText="계속 진행"
        cancelText="취소"
        confirmColor="red"
        open={showWarningDialog}
        onOpenChange={setShowWarningDialog}
        onConfirm={handleWarningConfirm}
        onCancel={() => setShowWarningDialog(false)}
      />
    </Container>
  );
}
