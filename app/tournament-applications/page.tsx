'use client';
import {
  Box,
  Text,
  Button,
  Flex,
  Badge,
  Card,
  Select,
  Heading,
  TextField,
  Dialog,
  Checkbox,
  Separator,
  RadioGroup,
  Switch,
} from '@radix-ui/themes';
import Container from '@/components/Container';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useUser } from '@/hooks/useUser';
import { hasPermissionLevel, isAdmin, isModerator } from '@/lib/authUtils';
import { useTournamentsByUserLevel } from '@/hooks/useTournaments';
import { useUpdateApplicationStatus } from '@/hooks/useTournamentApplications';
import type { TournamentApplication } from '@/model/tournamentApplication';

import SkeletonCard from '@/components/SkeletonCard';
import ConfirmDialog from '@/components/ConfirmDialog';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import useSWR from 'swr';

// ------------------------------
// helpers (stable references)
// ------------------------------
const STATUS_COLOR: Record<string, 'red' | 'blue' | 'green' | 'gray'> = {
  pending: 'blue',
  approved: 'green',
  rejected: 'red',
  cancelled: 'gray',
};

const STATUS_LABEL: Record<string, string> = {
  pending: '대기중',
  approved: '승인',
  rejected: '거절',
  cancelled: '취소',
};

const DIVISION_LABEL: Record<string, string> = {
  master: '마스터부',
  challenger: '챌린저부',
  futures: '퓨처스부',
  chrysanthemum: '국화부',
  forsythia: '개나리부',
};

const fmt = (d?: string) => (d ? format(new Date(d), 'yy.MM.dd HH:mm', { locale: ko }) : '');

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('Failed to fetch');
    return r.json();
  });

export default function TournamentApplicationsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { user } = useUser(session?.user?.email);

  // tournaments by user level
  const { tournaments, isLoading: tournamentsLoading } = useTournamentsByUserLevel(user?.level);

  // selection state
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('');
  const [divisionFilter, setDivisionFilter] = useState<string>('all');

  // 상세 검색 관련 상태
  const [showAdvancedFilterModal, setShowAdvancedFilterModal] = useState(false);
  const [isAdvancedFilterActive, setIsAdvancedFilterActive] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    hasSeed: false, // 시드가 주어진 팀만
    statusFilters: {
      approved: false,
      rejected: false,
      pending: false,
      cancelled: false,
    },
    registeredMembersOnly: false, // 등록회원만
    nonRegisteredMembersOnly: false, // 미등록회원만
    feeStatus: 'all', // 회비 상태: 'all', 'paid', 'unpaid'
    participantName: '', // 참가자 이름
    clubName: '', // 클럽명
  });

  // 시드 등록 관련 상태
  const [showSeedModal, setShowSeedModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<TournamentApplication | null>(
    null,
  );
  const [seedNumber, setSeedNumber] = useState<string>('');
  const [isUpdatingSeed, setIsUpdatingSeed] = useState(false);
  const [existingSeeds, setExistingSeeds] = useState<number[]>([]);

  // 미납팀 모달 관련 상태
  const [showUnpaidModal, setShowUnpaidModal] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState<string>('');

  // 회원목록 토글 상태 - 애플리케이션 ID를 키로 사용
  const [showMemberDetails, setShowMemberDetails] = useState<Set<string>>(new Set());
  const [showAllMemberDetails, setShowAllMemberDetails] = useState(false);

  // 회원목록 토글 함수
  const toggleMemberDetails = (applicationId: string) => {
    setShowMemberDetails((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(applicationId)) {
        newSet.delete(applicationId);
      } else {
        newSet.add(applicationId);
      }
      return newSet;
    });
  };

  // 전체 회원목록 토글 함수
  const toggleAllMemberDetails = () => {
    if (showAllMemberDetails) {
      // 모든 회원목록 닫기
      setShowMemberDetails(new Set());
    } else {
      // 모든 회원목록 열기
      const allApplicationIds = new Set(
        applications
          .filter((app) => app.tournamentId === selectedTournamentId && app._id)
          .map((app) => app._id!),
      );
      setShowMemberDetails(allApplicationIds);
    }
    setShowAllMemberDetails(!showAllMemberDetails);
  };

  // choose first tournament automatically
  useEffect(() => {
    if (tournaments?.length && !selectedTournamentId) {
      setSelectedTournamentId(tournaments[0]._id);
    }
  }, [tournaments, selectedTournamentId]);

  // applications via SWR (dependent on selectedTournamentId)
  const {
    data: applications = [],
    isLoading: applicationsLoading,
    mutate: mutateApplications,
  } = useSWR<TournamentApplication[]>(
    selectedTournamentId
      ? `/api/tournament-applications?tournamentId=${selectedTournamentId}`
      : null,
    fetcher,
    { keepPreviousData: false },
  );

  // 참가 신청 목록이 변경될 때마다 showMemberDetails 초기화
  useEffect(() => {
    if (applications.length > 0) {
      setShowMemberDetails(new Set());
    }
  }, [applications.length]);

  // my applications (memoized)
  const myApplications = useMemo(
    () => applications.filter((app) => app.createdBy === user?._id),
    [applications, user?._id],
  );

  // derive division options for the current tournament
  const divisionOptions = useMemo(() => {
    const set = new Set(
      applications.filter((a) => a.tournamentId === selectedTournamentId).map((a) => a.division),
    );
    return Array.from(set);
  }, [applications, selectedTournamentId]);

  // 조편성 상태 확인
  const [groupingStatus, setGroupingStatus] = useState<Record<string, boolean>>({});

  // 조편성 상태 조회
  useEffect(() => {
    if (selectedTournamentId) {
      fetch('/api/tournament-grouping/index')
        .then((res) => res.json())
        .then((data) => {
          const status: Record<string, boolean> = {};
          data.groupings?.forEach((g: { tournamentId: string; division: string }) => {
            if (g.tournamentId === selectedTournamentId) {
              status[g.division] = true;
            }
          });
          setGroupingStatus(status);
        })
        .catch((error) => {
          console.error('조편성 상태 조회 오류:', error);
        });
    }
  }, [selectedTournamentId]);

  // team count per division (memoized map)
  const divisionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of applications) {
      if (a.tournamentId !== selectedTournamentId) continue;
      counts[a.division] = (counts[a.division] ?? 0) + 1;
    }
    return counts;
  }, [applications, selectedTournamentId]);

  // filter & sort
  const filteredApplications = useMemo(() => {
    let list = applications.filter(
      (a) => divisionFilter === 'all' || a.division === divisionFilter,
    );

    // 상세 검색 필터 적용
    if (isAdvancedFilterActive) {
      // 시드 필터
      if (advancedFilters.hasSeed) {
        list = list.filter((app) => app.seed !== undefined && app.seed !== null);
      }

      // 상태 필터
      const activeStatusFilters = Object.entries(advancedFilters.statusFilters)
        .filter(([, isActive]) => isActive)
        .map(([status]) => status);

      if (activeStatusFilters.length > 0) {
        list = list.filter((app) => activeStatusFilters.includes(app.status));
      }

      // 등록회원 필터
      if (advancedFilters.registeredMembersOnly) {
        list = list.filter((app) =>
          app.teamMembers.some((member) => member.isRegisteredMember === true),
        );
      }

      if (advancedFilters.nonRegisteredMembersOnly) {
        list = list.filter((app) =>
          app.teamMembers.some((member) => member.isRegisteredMember === false),
        );
      }

      // 회비 납부 필터
      if (advancedFilters.feeStatus === 'paid') {
        list = list.filter((app) => app.isFeePaid === true);
      } else if (advancedFilters.feeStatus === 'unpaid') {
        list = list.filter((app) => app.isFeePaid === false);
      }

      // 참가자 이름 필터
      if (advancedFilters.participantName.trim()) {
        const query = advancedFilters.participantName.toLowerCase().trim();
        list = list.filter((app) => {
          const memberNames = app.teamMembers.map((member) => member.name.toLowerCase());
          return memberNames.some((name) => name.includes(query));
        });
      }

      // 클럽명 필터
      if (advancedFilters.clubName.trim()) {
        const query = advancedFilters.clubName.toLowerCase().trim();
        list = list.filter((app) => {
          const clubNames = app.teamMembers.map((member) => member.clubName.toLowerCase());
          return clubNames.some((clubName) => clubName.includes(query));
        });
      }
    }

    // 1) division asc, 2) applicationOrder desc
    return list.sort((a, b) =>
      a.division === b.division
        ? (b.applicationOrder || 0) - (a.applicationOrder || 0)
        : a.division.localeCompare(b.division),
    );
  }, [applications, divisionFilter, isAdvancedFilterActive, advancedFilters]);

  // group by division for rendering
  const groupedByDivision = useMemo(() => {
    const g: Record<string, TournamentApplication[]> = {};
    for (const a of filteredApplications) {
      (g[a.division] ||= []).push(a);
    }
    return Object.entries(g).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredApplications]);

  // 부서별 통계 계산
  const divisionStats = useMemo(() => {
    const stats: Record<
      string,
      {
        totalTeams: number;
        paidTeams: number;
        unpaidTeams: number;
        pendingTeams: number;
        approvedTeams: number;
        rejectedTeams: number;
      }
    > = {};

    applications.forEach((app) => {
      if (app.tournamentId !== selectedTournamentId) return;

      if (!stats[app.division]) {
        stats[app.division] = {
          totalTeams: 0,
          paidTeams: 0,
          unpaidTeams: 0,
          pendingTeams: 0,
          approvedTeams: 0,
          rejectedTeams: 0,
        };
      }

      stats[app.division].totalTeams++;

      if (app.isFeePaid) {
        stats[app.division].paidTeams++;
      } else {
        stats[app.division].unpaidTeams++;
      }

      switch (app.status) {
        case 'pending':
          stats[app.division].pendingTeams++;
          break;
        case 'approved':
          stats[app.division].approvedTeams++;
          break;
        case 'rejected':
          stats[app.division].rejectedTeams++;
          break;
      }
    });

    return stats;
  }, [applications, selectedTournamentId]);

  // 전체 통계 계산
  const totalStats = useMemo(() => {
    const total = {
      totalTeams: 0,
      paidTeams: 0,
      unpaidTeams: 0,
      pendingTeams: 0,
      approvedTeams: 0,
      rejectedTeams: 0,
    };

    Object.values(divisionStats).forEach((stats) => {
      total.totalTeams += stats.totalTeams;
      total.paidTeams += stats.paidTeams;
      total.unpaidTeams += stats.unpaidTeams;
      total.pendingTeams += stats.pendingTeams;
      total.approvedTeams += stats.approvedTeams;
      total.rejectedTeams += stats.rejectedTeams;
    });

    return total;
  }, [divisionStats]);

  // mutation hook
  const { trigger: updateStatus } = useUpdateApplicationStatus();

  const [confirmApp, setConfirmApp] = useState<TournamentApplication | null>(null);
  const [confirmStatus, setConfirmStatus] = useState<
    'approved' | 'rejected' | 'pending' | 'cancelled' | ''
  >('');
  const [showConfirm, setShowConfirm] = useState(false);

  const openStatusDialog = (
    app: TournamentApplication,
    status: 'approved' | 'rejected' | 'pending' | 'cancelled',
  ) => {
    setConfirmApp(app);
    setConfirmStatus(status);
    setShowConfirm(true);
  };

  const handleStatusUpdate = async (
    applicationId: string,
    newStatus: 'pending' | 'approved' | 'rejected' | 'cancelled',
  ) => {
    try {
      const currentApplication = applications.find((app) => app._id === applicationId);
      if (!currentApplication) {
        throw new Error('신청 내역을 찾을 수 없습니다.');
      }

      // Optimistic Update: 현재 데이터에서 직접 업데이트
      mutateApplications(
        (prev) =>
          (prev ?? []).map((app) =>
            app._id === applicationId
              ? { ...app, status: newStatus, updatedAt: new Date().toISOString() }
              : app,
          ),
        { revalidate: false, rollbackOnError: true },
      );

      // 서버 호출 및 결과 확인
      const result = await updateStatus({ id: applicationId, status: newStatus });

      // 서버 응답으로 최종 동기화 (서버에서 추가로 변경된 필드가 있을 수 있음)
      mutateApplications(
        (prev) =>
          (prev ?? []).map((app) => (app._id === applicationId ? { ...app, ...result } : app)),
        { revalidate: false },
      );
    } catch (e) {
      console.error('상태 업데이트 실패', e);
    } finally {
      setShowConfirm(false);
    }
  };

  // 시드 등록 모달 열기
  const openSeedModal = (application: TournamentApplication) => {
    setSelectedApplication(application);
    setSeedNumber(application.seed?.toString() || '');

    // 동일한 대회, 동일한 부서의 기존 시드 번호들 조회
    const sameDivisionApps = applications.filter(
      (app) =>
        app.tournamentId === application.tournamentId &&
        app.division === application.division &&
        app._id !== application._id,
    );
    const existingSeedsList = sameDivisionApps
      .map((app) => app.seed)
      .filter((seed): seed is number => seed !== undefined && seed !== null);
    setExistingSeeds(existingSeedsList);

    setShowSeedModal(true);
  };

  // 미납팀 모달 열기
  const openUnpaidModal = (division: string) => {
    setSelectedDivision(division);
    setShowUnpaidModal(true);
  };

  // 특정 부서의 미납팀 목록 가져오기
  const getUnpaidTeams = (division: string) => {
    return applications.filter(
      (app) =>
        app.tournamentId === selectedTournamentId && app.division === division && !app.isFeePaid,
    );
  };

  // 시드 등록 처리
  const handleSeedUpdate = async () => {
    if (!selectedApplication?._id || !seedNumber.trim()) return;

    const newSeedValue = parseInt(seedNumber, 10);

    setIsUpdatingSeed(true);

    // 현재 applications에서 해당 항목 찾기
    const currentApplication = applications.find((app) => app._id === selectedApplication._id);
    if (!currentApplication) {
      throw new Error('신청 내역을 찾을 수 없습니다.');
    }

    // Optimistic Update: 현재 데이터에서 직접 업데이트
    mutateApplications(
      (prev) =>
        (prev ?? []).map((app) =>
          app._id === selectedApplication._id
            ? { ...app, seed: newSeedValue === 0 ? undefined : newSeedValue }
            : app,
        ),
      { revalidate: false, rollbackOnError: true },
    );
    setShowSeedModal(false);
    try {
      const response = await fetch(`/api/tournament-applications/${selectedApplication._id}/seed`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          seedNumber: newSeedValue,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '시드 등록에 실패했습니다.');
      }

      // 서버 응답으로 최종 동기화 (필요한 경우에만)
      const updatedApplication = await response.json();
      mutateApplications(
        (prev) =>
          (prev ?? []).map((app) =>
            app._id === selectedApplication._id ? { ...app, ...updatedApplication } : app,
          ),
        { revalidate: false },
      );

      setSelectedApplication(null);
      setSeedNumber('');
    } catch (error) {
      console.error('시드 등록 오류:', error);
      alert('시드 등록에 실패했습니다.');
      // 에러 발생 시 rollbackOnError: true로 인해 자동으로 이전 상태로 복원됨
    } finally {
      setIsUpdatingSeed(false);
    }
  };

  const onTournamentChange = (id: string) => {
    setSelectedTournamentId(id);
    setDivisionFilter('all');
  };

  const canEdit = (app: TournamentApplication | undefined | null) => {
    if (!app) return false;
    console.log(app);

    // 관리자(레벨 5 이상)는 항상 수정 가능
    if (hasPermissionLevel(user, 5)) return true;

    // 본인이 작성한 신청이 아니면 수정 불가
    if (app.createdBy !== user?._id) return false;

    // 승인된 신청은 수정 불가
    if (app.status === 'approved') return false;

    // 대회 정보가 없으면 수정 불가
    if (!app.tournament) return false;

    // 참가 신청 마감일이 지났는지 확인
    if (app.tournament.registrationDeadline) {
      const now = new Date();
      const endDate = new Date(app.tournament.registrationDeadline);

      // 마감일의 다음날 자정(00:00:00)을 기준으로 비교
      const deadlineEnd = new Date(endDate);
      deadlineEnd.setDate(deadlineEnd.getDate() + 1);
      deadlineEnd.setHours(0, 0, 0, 0);

      // 마감일이 지났으면 수정 불가
      if (now >= deadlineEnd) return false;
    }

    return true;
  };

  // ---------------------------------
  // render
  // ---------------------------------
  const loading = tournamentsLoading || applicationsLoading;
  const admin = isAdmin(user);
  const moderator = isModerator(user);

  return (
    <Container>
      {loading ? (
        <SkeletonCard />
      ) : (
        <Box>
          {/* Filters */}
          <Box mb="6" className="print-none">
            <Flex gap="3" mb="4" align="center" wrap="wrap">
              <Select.Root value={selectedTournamentId} onValueChange={onTournamentChange} size="3">
                <Select.Trigger placeholder={tournaments?.[0]?.title || '대회를 선택하세요'} />
                <Select.Content>
                  {tournaments.map((t) => (
                    <Select.Item key={t._id} value={t._id}>
                      {t.title}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
              <Select.Root value={divisionFilter} onValueChange={setDivisionFilter} size="3">
                <Select.Trigger placeholder="전체" />
                <Select.Content>
                  <Select.Item value="all">전체</Select.Item>
                  {divisionOptions.map((d) => (
                    <Select.Item key={d} value={d}>
                      {DIVISION_LABEL[d] || d}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>

              <Button
                variant={isAdvancedFilterActive ? 'solid' : 'soft'}
                color={isAdvancedFilterActive ? 'blue' : 'gray'}
                size="3"
                onClick={() => setShowAdvancedFilterModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M1.5 4.5h13l-4.5 6v3.5l-4-2V10.5L1.5 4.5z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {isAdvancedFilterActive ? '상세검색 (활성)' : '상세검색'}
              </Button>
            </Flex>
          </Box>

          {/* My applications */}
          {myApplications.length > 0 && (
            <Box mb="6">
              <Heading size="4" mb="3">
                나의신청내역
              </Heading>
              <div className="space-y-4">
                {myApplications.map((application) => (
                  <Card
                    key={application._id}
                    className={`p-6 transition-colors ${canEdit(application) ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                    onClick={() => {
                      if (canEdit(application))
                        router.push(`/tournament-applications/${application._id}/edit`);
                    }}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge color={STATUS_COLOR[application.status] || 'gray'}>
                            {STATUS_LABEL[application.status] || application.status}
                          </Badge>
                          {application.applicationOrder && (
                            <Badge color="blue">{application.applicationOrder}번째 신청</Badge>
                          )}
                          <Badge color="blue" style={{ fontWeight: 500 }}>
                            현재 {divisionCounts[application.division] ?? 0}팀 신청
                          </Badge>
                        </div>
                        <Text color="gray" size="2">
                          {fmt(application.createdAt)}
                        </Text>
                      </div>

                      {/* 참가자 */}
                      <div className="space-y-3">
                        <Text size="4" weight="bold" mb="2" as="div">
                          {application.tournament?.title || `대회 ID: ${application.tournamentId}`}{' '}
                          - {DIVISION_LABEL[application.division] || application.division}
                        </Text>

                        {application.tournamentType === 'team' && (
                          <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-500">
                            <Text weight="bold" color="gray" mr="2">
                              참가 클럽
                            </Text>
                            <Text weight="bold" color="blue">
                              {application.teamMembers[0]?.clubName || '-'}
                            </Text>
                            <Text weight="bold">({application.teamMembers.length}명)</Text>
                          </div>
                        )}

                        <div className="grid gap-2">
                          {application.teamMembers.map((m, i) => (
                            <div
                              key={i}
                              className="p-3 bg-gray-50 rounded flex items-center justify-between"
                            >
                              <div className="flex items-center gap-3">
                                <Text weight="bold" color="gray">
                                  {i + 1}번
                                </Text>
                                <Text weight="bold">
                                  {m.name}
                                  {application.tournamentType === 'individual' && (
                                    <>
                                      {' / '}
                                      {m.clubName}
                                    </>
                                  )}
                                </Text>
                              </div>
                              <div className="flex items-center gap-3">
                                <Text weight="bold" color="gray">
                                  점수
                                </Text>
                                <Text>{m.score || '-'}</Text>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 참가비 */}
                      <div className="flex items-center justify-between">
                        <Text weight="bold">참가비 납부</Text>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-4 h-4 rounded-full ${application.isFeePaid ? 'bg-green-500' : 'bg-red-500'}`}
                          />
                          <Text weight="bold" color={application.isFeePaid ? 'green' : 'red'}>
                            {application.isFeePaid ? '납부 완료' : '미납'}
                          </Text>
                        </div>
                      </div>

                      {application.memo && (
                        <div>
                          <Text weight="bold">메모</Text>
                          <Text className="block mt-1">{application.memo}</Text>
                        </div>
                      )}

                      <Flex gap="3" justify="end" pt="4" className="border-t">
                        <Button
                          variant="soft"
                          onClick={() =>
                            application.tournamentId &&
                            router.push(`/tournaments/${application.tournamentId}`)
                          }
                        >
                          대회 상세보기
                        </Button>
                        {canEdit(application) && (
                          <Button
                            variant="soft"
                            onClick={() =>
                              router.push(`/tournament-applications/${application._id}/edit`)
                            }
                          >
                            수정
                          </Button>
                        )}
                      </Flex>
                    </div>
                  </Card>
                ))}
              </div>
            </Box>
          )}

          {/* 전체 목록 */}
          <Box>
            <Flex justify="between" align="center" mb="2">
              <Heading size="4">전체참가신청목록</Heading>
              {moderator && (
                <Flex align="center" gap="2" className="print-none">
                  <Text size="3" color="gray">
                    전체회원목록표시
                  </Text>
                  <Switch
                    size="3"
                    checked={showAllMemberDetails}
                    onCheckedChange={toggleAllMemberDetails}
                  />
                </Flex>
              )}
            </Flex>
            {moderator && (
              <Box className="table-view" mb="4">
                <table className="text-center">
                  <thead>
                    <tr>
                      <th>참가부서</th>
                      <th>총 참가팀</th>
                      <th>회비납부</th>
                      <th>회비미납</th>
                      <th>승인대기</th>
                      <th>승인완료</th>
                      <th>거절</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* 전체 통계 행 */}
                    <tr style={{ backgroundColor: '#f8f9fa', fontWeight: 'bold' }}>
                      <td>
                        <Text weight="bold" color="gray">
                          전체
                        </Text>
                      </td>
                      <td>
                        <Text weight="bold" color="gray">
                          {totalStats.totalTeams}팀
                        </Text>
                      </td>
                      <td>
                        <Text color="green" weight="bold">
                          {totalStats.paidTeams}팀
                        </Text>
                      </td>
                      <td>
                        <Text
                          color="red"
                          weight="bold"
                          style={{ cursor: totalStats.unpaidTeams > 0 ? 'pointer' : 'default' }}
                          onClick={() => totalStats.unpaidTeams > 0 && openUnpaidModal('all')}
                        >
                          {totalStats.unpaidTeams}팀
                        </Text>
                      </td>
                      <td>
                        <Text color="blue" weight="bold">
                          {totalStats.pendingTeams}팀
                        </Text>
                      </td>
                      <td>
                        <Text color="green" weight="bold">
                          {totalStats.approvedTeams}팀
                        </Text>
                      </td>
                      <td>
                        <Text color="red" weight="bold">
                          {totalStats.rejectedTeams}팀
                        </Text>
                      </td>
                    </tr>
                    {/* 부서별 통계 행들 */}
                    {Object.entries(divisionStats)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([division, stats]) => (
                        <tr key={division}>
                          <td>{DIVISION_LABEL[division] || division}</td>
                          <td>
                            <Text weight="bold">{stats.totalTeams}팀</Text>
                          </td>
                          <td>
                            <Text color="green" weight="bold">
                              {stats.paidTeams}팀
                            </Text>
                          </td>
                          <td>
                            <Text
                              color="red"
                              weight="bold"
                              style={{ cursor: stats.unpaidTeams > 0 ? 'pointer' : 'default' }}
                              onClick={() => stats.unpaidTeams > 0 && openUnpaidModal(division)}
                            >
                              {stats.unpaidTeams}팀
                            </Text>
                          </td>
                          <td>
                            <Text color="blue" weight="bold">
                              {stats.pendingTeams}팀
                            </Text>
                          </td>
                          <td>
                            <Text color="green" weight="bold">
                              {stats.approvedTeams}팀
                            </Text>
                          </td>
                          <td>
                            <Text color="red" weight="bold">
                              {stats.rejectedTeams}팀
                            </Text>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </Box>
            )}
            {filteredApplications.length === 0 ? (
              <Card className="p-6 text-center">참가 신청 내역이 없습니다.</Card>
            ) : (
              <div className="space-y-6">
                {groupedByDivision.map(([division, apps]) => (
                  <Box key={division}>
                    <Flex justify="between" align="center" py="3">
                      <Heading size="3" color="blue">
                        {DIVISION_LABEL[division] || division} ({apps.length}팀 신청)
                      </Heading>

                      {admin &&
                        (groupingStatus[division] ? (
                          <Button
                            variant="soft"
                            size="2"
                            color="green"
                            onClick={() => {
                              router.push(
                                `/tournament-grouping/${selectedTournamentId}/${division}`,
                              );
                            }}
                            className="print-none"
                          >
                            조편성 보기
                          </Button>
                        ) : (
                          <Button
                            variant="soft"
                            size="2"
                            onClick={() => {
                              router.push(
                                `/tournament-grouping/new?tournamentId=${selectedTournamentId}&division=${division}`,
                              );
                            }}
                            className="print-none"
                          >
                            조편성
                          </Button>
                        ))}
                    </Flex>
                    <div className="space-y-4">
                      {apps.map((application) => {
                        return (
                          <Card
                            key={application._id}
                            className={`p-6 transition-colors ${canEdit(application) ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                            onClick={() => {
                              if (canEdit(application))
                                router.push(`/tournament-applications/${application._id}/edit`);
                            }}
                          >
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {moderator && (
                                    <Badge color={STATUS_COLOR[application.status] || 'gray'}>
                                      {STATUS_LABEL[application.status] || application.status}
                                    </Badge>
                                  )}
                                  {application.applicationOrder && (
                                    <Badge color="blue">
                                      {application.applicationOrder}번째 신청
                                    </Badge>
                                  )}
                                  {application.seed && (
                                    <Badge color="orange">시드 {application.seed}번</Badge>
                                  )}
                                  {admin && (
                                    <Button
                                      type="button"
                                      size="1"
                                      variant="soft"
                                      color="gray"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openSeedModal(application);
                                      }}
                                    >
                                      {application.seed ? '시드수정' : '시드등록'}
                                    </Button>
                                  )}
                                </div>
                                <Text color="gray" size="2">
                                  {fmt(application.createdAt)}
                                </Text>
                              </div>

                              {application.tournamentType === 'team' && (
                                <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-500">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Text weight="bold" color="blue">
                                        {application.teamMembers[0]?.clubName || '-'}
                                      </Text>
                                      <Text weight="bold">
                                        ({application.teamMembers.length}명)
                                      </Text>
                                      <Text weight="bold" color="gray">
                                        {application.memo}
                                      </Text>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {moderator && (
                                        <Text
                                          weight="bold"
                                          color={application.isFeePaid ? 'green' : 'red'}
                                        >
                                          {application.isFeePaid ? '납부' : '미납'}
                                        </Text>
                                      )}
                                      <Button
                                        type="button"
                                        size="1"
                                        variant="soft"
                                        color="gray"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (application._id) {
                                            toggleMemberDetails(application._id);
                                          }
                                        }}
                                      >
                                        {(() => {
                                          return application._id &&
                                            showMemberDetails.has(application._id) ? (
                                            <svg
                                              width="16"
                                              height="16"
                                              viewBox="0 0 16 16"
                                              fill="none"
                                            >
                                              <path
                                                d="M4 10L8 6L12 10"
                                                stroke="currentColor"
                                                strokeWidth="1.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                              />
                                            </svg>
                                          ) : (
                                            <svg
                                              width="16"
                                              height="16"
                                              viewBox="0 0 16 16"
                                              fill="none"
                                            >
                                              <path
                                                d="M4 6L8 10L12 6"
                                                stroke="currentColor"
                                                strokeWidth="1.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                              />
                                            </svg>
                                          );
                                        })()}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* 개인전이거나 단체전에서 토글이 활성화된 경우에만 회원목록 표시 */}
                              {(() => {
                                if (application.tournamentType === 'individual') return true;
                                if (application.tournamentType === 'team') {
                                  return (
                                    application._id &&
                                    (showAllMemberDetails || showMemberDetails.has(application._id))
                                  );
                                }
                                return false;
                              })() && (
                                <div className="grid gap-2">
                                  {application.teamMembers.map((member, index) => (
                                    <div
                                      key={index}
                                      className="p-3 bg-gray-50 rounded flex items-center gap-2"
                                    >
                                      <Text weight="bold" color="gray">
                                        {index + 1}번
                                      </Text>
                                      <Text weight="bold">
                                        {moderator
                                          ? member.name
                                          : member.name.charAt(0) +
                                            '*'.repeat(Math.max(member.name.length - 1, 0))}
                                        {application.tournamentType === 'individual' && (
                                          <>
                                            {' / '}
                                            {member.clubName}
                                          </>
                                        )}
                                      </Text>
                                      {moderator && (
                                        <>
                                          {member.isRegisteredMember === false && (
                                            <Badge color="red" size="2">
                                              미등록
                                            </Badge>
                                          )}
                                          {member.isRegisteredMember === true && (
                                            <Badge color="green" size="2">
                                              등록
                                            </Badge>
                                          )}
                                          <Text size="2">
                                            {member.birth &&
                                              (() => {
                                                const birthYear = parseInt(member.birth, 10);
                                                if (!isNaN(birthYear)) {
                                                  const currentYear = new Date().getFullYear();
                                                  const age = currentYear - birthYear + 1; // 한국식 나이
                                                  return `${member.birth} (${age}세)`;
                                                }
                                                return member.birth;
                                              })()}
                                          </Text>
                                          <Box>
                                            {member.clubMemberInfo?.tennisStartYear && (
                                              <Text size="2" color="gray">
                                                {member.clubMemberInfo.tennisStartYear}년
                                              </Text>
                                            )}
                                            {member.clubMemberInfo?.gender && (
                                              <Text size="2" color="gray">
                                                {member.clubMemberInfo.tennisStartYear && ' / '}
                                                {member.clubMemberInfo.gender}
                                              </Text>
                                            )}
                                          </Box>
                                        </>
                                      )}
                                      <div className="ml-auto">
                                        <Text weight="bold" color="gray">
                                          점수
                                        </Text>
                                        <Text>{member.score || '-'}</Text>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {admin && (
                                <div className="btn-wrap border-t pt-4 flex gap-2 print-none">
                                  <Button
                                    variant="soft"
                                    color="red"
                                    size="2"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openStatusDialog(application, 'rejected');
                                    }}
                                    disabled={application.status === 'rejected'}
                                  >
                                    거절
                                  </Button>
                                  <Button
                                    variant="soft"
                                    color="green"
                                    size="2"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openStatusDialog(application, 'approved');
                                    }}
                                    disabled={application.status === 'approved'}
                                  >
                                    승인
                                  </Button>
                                </div>
                              )}

                              {/* 승인된 신청에 대한 안내 메시지 */}
                              {!canEdit(application) && application.status === 'approved' && (
                                <div className="border-t pt-4">
                                  <Text
                                    size="2"
                                    color="red"
                                    weight="bold"
                                    className="text-center block"
                                  >
                                    승인된 게임은 수정할 수 없습니다
                                  </Text>
                                </div>
                              )}
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </Box>
                ))}
              </div>
            )}
          </Box>
        </Box>
      )}

      <ConfirmDialog
        title="상태 변경"
        description={`이 신청을 ${STATUS_LABEL[confirmStatus] || confirmStatus}로 변경하시겠습니까?`}
        confirmText="변경"
        cancelText="취소"
        confirmColor={confirmStatus === 'approved' ? 'green' : 'red'}
        open={showConfirm}
        onOpenChange={setShowConfirm}
        onConfirm={() => {
          if (confirmApp?._id && confirmStatus) {
            handleStatusUpdate(confirmApp._id, confirmStatus);
          }
        }}
        onCancel={() => setShowConfirm(false)}
      />

      {/* 상세 검색 모달 */}
      <Dialog.Root open={showAdvancedFilterModal} onOpenChange={setShowAdvancedFilterModal}>
        <Dialog.Content
          style={{
            maxWidth: 600,
            position: 'fixed',
            bottom: '0',
            left: '50%',
            transform: 'translateX(-50%)',
            margin: 0,
            maxHeight: '80vh',
            overflowY: 'auto',
          }}
        >
          <Dialog.Title>상세 검색</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            원하는 조건으로 참가 신청을 필터링할 수 있습니다.
          </Dialog.Description>

          <Flex direction="column" gap="4">
            {/* 시드 필터 */}
            <Flex align="center" gap="2">
              <Checkbox
                id="hasSeed"
                checked={advancedFilters.hasSeed}
                onCheckedChange={(checked) =>
                  setAdvancedFilters((prev) => ({ ...prev, hasSeed: checked as boolean }))
                }
              />
              <Text as="label" htmlFor="hasSeed">
                시드가 주어진 팀만 보기
              </Text>
            </Flex>

            <Separator size="4" />

            {/* 상태 필터 */}
            <Flex direction="column" gap="2">
              <Flex align="center" gap="2">
                <Checkbox
                  id="approved"
                  checked={advancedFilters.statusFilters.approved}
                  onCheckedChange={(checked) =>
                    setAdvancedFilters((prev) => ({
                      ...prev,
                      statusFilters: { ...prev.statusFilters, approved: checked as boolean },
                    }))
                  }
                />
                <Text as="label" htmlFor="approved">
                  승인된 신청
                </Text>
              </Flex>
              <Flex align="center" gap="2">
                <Checkbox
                  id="rejected"
                  checked={advancedFilters.statusFilters.rejected}
                  onCheckedChange={(checked) =>
                    setAdvancedFilters((prev) => ({
                      ...prev,
                      statusFilters: { ...prev.statusFilters, rejected: checked as boolean },
                    }))
                  }
                />
                <Text as="label" htmlFor="rejected">
                  거절된 신청
                </Text>
              </Flex>
              <Flex align="center" gap="2">
                <Checkbox
                  id="cancelled"
                  checked={advancedFilters.statusFilters.cancelled}
                  onCheckedChange={(checked) =>
                    setAdvancedFilters((prev) => ({
                      ...prev,
                      statusFilters: { ...prev.statusFilters, cancelled: checked as boolean },
                    }))
                  }
                />
                <Text as="label" htmlFor="cancelled">
                  취소된 신청
                </Text>
              </Flex>
            </Flex>

            <Separator size="4" />

            {/* 회원 등록 상태 필터 */}
            <Flex align="center" gap="2">
              <Checkbox
                id="nonRegisteredMembersOnly"
                checked={advancedFilters.nonRegisteredMembersOnly}
                onCheckedChange={(checked) =>
                  setAdvancedFilters((prev) => ({
                    ...prev,
                    nonRegisteredMembersOnly: checked as boolean,
                  }))
                }
              />
              <Text as="label" htmlFor="nonRegisteredMembersOnly">
                미등록회원만 보기
              </Text>
            </Flex>

            <Separator size="4" />

            {/* 회비 납부 상태 필터 */}
            <div>
              <Text as="div" size="2" mb="2" weight="bold">
                회비 납부 상태
              </Text>
              <RadioGroup.Root
                value={advancedFilters.feeStatus}
                onValueChange={(value) =>
                  setAdvancedFilters((prev) => ({ ...prev, feeStatus: value }))
                }
              >
                <Flex direction="column" gap="2">
                  <Flex align="center" gap="2">
                    <RadioGroup.Item value="all" id="feeAll" />
                    <Text as="label" htmlFor="feeAll" size="2">
                      전체
                    </Text>
                  </Flex>
                  <Flex align="center" gap="2">
                    <RadioGroup.Item value="paid" id="feePaid" />
                    <Text as="label" htmlFor="feePaid" size="2">
                      회비 납부한 팀만
                    </Text>
                  </Flex>
                  <Flex align="center" gap="2">
                    <RadioGroup.Item value="unpaid" id="feeUnpaid" />
                    <Text as="label" htmlFor="feeUnpaid" size="2">
                      회비 미납 팀만
                    </Text>
                  </Flex>
                </Flex>
              </RadioGroup.Root>
            </div>

            <Separator size="4" />

            {/* 상세 검색 필드 */}
            <div>
              <Flex direction="column" gap="3">
                <TextField.Root
                  size="3"
                  placeholder="참가자 이름으로 검색"
                  value={advancedFilters.participantName}
                  onChange={(e) =>
                    setAdvancedFilters((prev) => ({ ...prev, participantName: e.target.value }))
                  }
                />
                <TextField.Root
                  size="3"
                  placeholder="클럽명으로 검색"
                  value={advancedFilters.clubName}
                  onChange={(e) =>
                    setAdvancedFilters((prev) => ({ ...prev, clubName: e.target.value }))
                  }
                />
              </Flex>
            </div>
          </Flex>

          <Flex gap="3" mt="4" justify="end">
            <Button
              variant="soft"
              color="gray"
              onClick={() => {
                setAdvancedFilters({
                  hasSeed: false,
                  statusFilters: {
                    approved: false,
                    rejected: false,
                    pending: false,
                    cancelled: false,
                  },
                  registeredMembersOnly: false,
                  nonRegisteredMembersOnly: false,
                  feeStatus: 'all',
                  participantName: '',
                  clubName: '',
                });
                setIsAdvancedFilterActive(false);
              }}
            >
              초기화
            </Button>
            <Dialog.Close>
              <Button
                onClick={() => {
                  // 필터가 하나라도 활성화되어 있으면 상세 검색 활성화
                  const hasActiveFilters = Boolean(
                    advancedFilters.hasSeed ||
                      Object.values(advancedFilters.statusFilters).some(Boolean) ||
                      advancedFilters.registeredMembersOnly ||
                      advancedFilters.nonRegisteredMembersOnly ||
                      advancedFilters.feeStatus !== 'all' ||
                      advancedFilters.participantName.trim() !== '' ||
                      advancedFilters.clubName.trim() !== '',
                  );

                  setIsAdvancedFilterActive(hasActiveFilters);
                }}
              >
                적용
              </Button>
            </Dialog.Close>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      {/* 시드 등록 모달 */}
      <Dialog.Root open={showSeedModal} onOpenChange={setShowSeedModal}>
        <Dialog.Content style={{ maxWidth: 500 }}>
          <Dialog.Title>시드 등록</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            {selectedApplication?.teamMembers[0]?.name}님의 시드 번호를 입력해주세요.
          </Dialog.Description>

          <Flex direction="column" gap="3">
            <div>
              <Text as="div" size="2" mb="1" weight="bold">
                시드 번호
              </Text>
              <TextField.Root
                type="number"
                min="0"
                placeholder="시드 번호를 입력하세요 (0: 시드 삭제)"
                value={seedNumber}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSeedNumber(e.target.value)}
              />
            </div>

            {/* 기존 시드 번호 안내 */}
            {existingSeeds.length > 0 && (
              <div>
                <Text as="div" size="2" mb="1" weight="bold" color="gray">
                  이미 사용 중인 시드 번호
                </Text>
                <Flex gap="2" wrap="wrap">
                  {existingSeeds
                    .sort((a, b) => a - b)
                    .map((seed) => (
                      <Badge key={seed} color="red" size="1">
                        {seed}번
                      </Badge>
                    ))}
                </Flex>
                <Text size="1" color="gray" mt="2">
                  위 번호는 사용할 수 없습니다.
                </Text>
              </div>
            )}

            {/* 시드 삭제 옵션 */}
            {selectedApplication?.seed && (
              <div>
                <Text as="div" size="2" mb="1" weight="bold" color="red">
                  시드 삭제
                </Text>
                <Badge
                  color="red"
                  size="1"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSeedNumber('0')}
                >
                  0번 (시드 삭제)
                </Badge>
                <Text size="1" color="gray" mt="2">
                  클릭하면 시드가 삭제됩니다.
                </Text>
              </div>
            )}

            {/* 사용 가능한 시드 번호 추천 */}
            {existingSeeds.length > 0 && (
              <div>
                <Text as="div" size="2" mb="1" weight="bold" color="green">
                  추천 시드 번호
                </Text>
                <Flex gap="2" wrap="wrap">
                  {Array.from({ length: 10 }, (_, i) => i + 1)
                    .filter((num) => !existingSeeds.includes(num))
                    .slice(0, 5)
                    .map((seed) => (
                      <Badge
                        key={seed}
                        color="green"
                        size="1"
                        style={{ cursor: 'pointer' }}
                        onClick={() => setSeedNumber(seed.toString())}
                      >
                        {seed}번
                      </Badge>
                    ))}
                </Flex>
                <Text size="1" color="gray" mt="2">
                  클릭하면 자동으로 입력됩니다.
                </Text>
              </div>
            )}
          </Flex>

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                취소
              </Button>
            </Dialog.Close>
            <Button
              onClick={handleSeedUpdate}
              disabled={
                isUpdatingSeed ||
                !seedNumber.trim() ||
                (parseInt(seedNumber, 10) > 0 && existingSeeds.includes(parseInt(seedNumber, 10)))
              }
            >
              {isUpdatingSeed ? '처리중...' : parseInt(seedNumber, 10) === 0 ? '삭제' : '등록'}
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      {/* 미납팀 목록 모달 */}
      <Dialog.Root open={showUnpaidModal} onOpenChange={setShowUnpaidModal}>
        <Dialog.Content style={{ maxWidth: 800, maxHeight: '80vh', overflowY: 'auto' }}>
          <Flex justify="between" align="center" mb="2">
            <Dialog.Title>
              회비 미납팀 목록 -{' '}
              {selectedDivision === 'all'
                ? '전체'
                : DIVISION_LABEL[selectedDivision] || selectedDivision}
            </Dialog.Title>
            <Dialog.Close>
              <Button variant="ghost" size="3" style={{ padding: '8px' }}>
                <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M12 4L4 12M4 4L12 12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Button>
            </Dialog.Close>
          </Flex>
          <Dialog.Description size="2" mb="4">
            회비를 납부하지 않은 팀들의 목록입니다.
          </Dialog.Description>

          <div className="space-y-4">
            {(() => {
              const unpaidTeams =
                selectedDivision === 'all'
                  ? applications.filter(
                      (app) => app.tournamentId === selectedTournamentId && !app.isFeePaid,
                    )
                  : getUnpaidTeams(selectedDivision);

              if (unpaidTeams.length === 0) {
                return (
                  <Card className="p-6 text-center">
                    <Text color="green" weight="bold" mb="4">
                      미납팀이 없습니다.
                    </Text>
                  </Card>
                );
              }

              return unpaidTeams.map((application) => (
                <Card key={application._id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Text weight="bold" size="3">
                        {DIVISION_LABEL[application.division] || application.division}/
                        {application.tournamentType === 'team'
                          ? `${application.teamMembers[0]?.clubName} ${application.memo ? `(${application.memo})` : ''}`
                          : application.teamMembers.map((m) => m.name).join(', ')}
                      </Text>

                      <Button
                        size="2"
                        variant="soft"
                        onClick={() => {
                          if (canEdit(application)) {
                            router.push(`/tournament-applications/${application._id}/edit`);
                          }
                        }}
                      >
                        상세보기
                      </Button>
                    </div>
                  </div>
                </Card>
              ));
            })()}
          </div>
        </Dialog.Content>
      </Dialog.Root>
    </Container>
  );
}
