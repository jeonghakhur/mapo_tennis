'use client';
import { Box, Text, Button, Flex, Badge, Card, Select, Heading } from '@radix-ui/themes';
import Container from '@/components/Container';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useUser } from '@/hooks/useUser';
import { hasPermissionLevel } from '@/lib/authUtils';
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
    { keepPreviousData: true },
  );

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
    const list = applications.filter(
      (a) => divisionFilter === 'all' || a.division === divisionFilter,
    );
    // 1) division asc, 2) applicationOrder desc
    return list.sort((a, b) =>
      a.division === b.division
        ? (b.applicationOrder || 0) - (a.applicationOrder || 0)
        : a.division.localeCompare(b.division),
    );
  }, [applications, divisionFilter]);

  // group by division for rendering
  const groupedByDivision = useMemo(() => {
    const g: Record<string, TournamentApplication[]> = {};
    for (const a of filteredApplications) {
      (g[a.division] ||= []).push(a);
    }
    return Object.entries(g).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredApplications]);

  // per-row mutation state (ids)
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());

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

  const toggleBusy = (id: string, on: boolean) =>
    setBusyIds((prev) => {
      const next = new Set(prev);
      if (on) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });

  const handleStatusUpdate = async (
    applicationId: string,
    newStatus: 'pending' | 'approved' | 'rejected' | 'cancelled',
  ) => {
    try {
      toggleBusy(applicationId, true);

      // optimistic update of the list cache
      await mutateApplications(
        (prev) =>
          (prev ?? []).map((app) =>
            app._id === applicationId
              ? { ...app, status: newStatus, updatedAt: new Date().toISOString() }
              : app,
          ),
        { revalidate: false, rollbackOnError: true },
      );

      // server call
      const result = await updateStatus({ id: applicationId, status: newStatus });

      // sync with server response if any shape differs
      await mutateApplications(
        (prev) =>
          (prev ?? []).map((app) => (app._id === applicationId ? { ...app, ...result } : app)),
        { revalidate: false },
      );
    } catch (e) {
      // fallback: revalidate to rollback to server state
      await mutateApplications();
      console.error('상태 업데이트 실패', e);
    } finally {
      toggleBusy(applicationId, false);
      setShowConfirm(false);
    }
  };

  const onTournamentChange = (id: string) => {
    setSelectedTournamentId(id);
    setDivisionFilter('all');
  };

  const canEdit = (app: TournamentApplication | undefined | null) =>
    !!app && (app.createdBy === user?._id || hasPermissionLevel(user, 4));

  // ---------------------------------
  // render
  // ---------------------------------
  const loading = tournamentsLoading || applicationsLoading;

  return (
    <Container>
      {loading ? (
        <SkeletonCard />
      ) : (
        <Box>
          {/* Filters */}
          <Box mb="6">
            <Flex gap="3" mb="4" align="center" wrap="wrap">
              <Flex gap="3" align="center">
                <Select.Root
                  value={selectedTournamentId}
                  onValueChange={onTournamentChange}
                  size="3"
                >
                  <Select.Trigger placeholder={tournaments?.[0]?.title || '대회를 선택하세요'} />
                  <Select.Content>
                    {tournaments.map((t) => (
                      <Select.Item key={t._id} value={t._id}>
                        {t.title}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </Flex>
              <Flex gap="3" align="center">
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
              </Flex>
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
            <Heading size="4" mb="3">
              전체참가신청목록
            </Heading>

            {filteredApplications.length === 0 ? (
              <Card className="p-6 text-center">
                <Text color="gray">참가 신청 내역이 없습니다.</Text>
              </Card>
            ) : (
              <div className="space-y-6">
                {groupedByDivision.map(([division, apps]) => (
                  <Box key={division}>
                    <Heading size="3" mb="3" color="blue">
                      {DIVISION_LABEL[division] || division} ({apps.length}팀 신청)
                    </Heading>
                    <div className="space-y-4">
                      {apps.map((application) => {
                        const isAdmin = hasPermissionLevel(user, 4);
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
                                  {isAdmin && (
                                    <Badge color={STATUS_COLOR[application.status] || 'gray'}>
                                      {STATUS_LABEL[application.status] || application.status}
                                    </Badge>
                                  )}
                                  {application.applicationOrder && (
                                    <Badge color="blue">
                                      {application.applicationOrder}번째 신청
                                    </Badge>
                                  )}
                                </div>
                                <Text color="gray" size="2">
                                  {fmt(application.createdAt)}
                                </Text>
                              </div>

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
                                {application.teamMembers.map((member, index) => (
                                  <div
                                    key={index}
                                    className="p-3 bg-gray-50 rounded flex items-center justify-between"
                                  >
                                    <div className="flex items-center gap-3">
                                      <Text weight="bold" color="gray">
                                        {index + 1}번
                                      </Text>
                                      <Text weight="bold">
                                        {isAdmin
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
                                      {isAdmin && (
                                        <>
                                          {member.isRegisteredMember === false && (
                                            <Badge color="red" size="1">
                                              미등록
                                            </Badge>
                                          )}
                                          {member.isRegisteredMember === true && (
                                            <Badge color="green" size="1">
                                              등록회원
                                            </Badge>
                                          )}
                                        </>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <Text weight="bold" color="gray">
                                        점수
                                      </Text>
                                      <Text>{member.score || '-'}</Text>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {hasPermissionLevel(user, 4) && (
                                <div className="btn-wrap border-t pt-4 flex gap-2">
                                  <Button
                                    variant="soft"
                                    color="red"
                                    size="2"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openStatusDialog(application, 'rejected');
                                    }}
                                    disabled={
                                      application.status === 'rejected' ||
                                      busyIds.has(application._id || '')
                                    }
                                  >
                                    {busyIds.has(application._id || '') ? '처리중...' : '거절'}
                                  </Button>
                                  <Button
                                    variant="soft"
                                    color="green"
                                    size="2"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openStatusDialog(application, 'approved');
                                    }}
                                    disabled={
                                      application.status === 'approved' ||
                                      busyIds.has(application._id || '')
                                    }
                                  >
                                    {busyIds.has(application._id || '') ? '처리중...' : '승인'}
                                  </Button>
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
    </Container>
  );
}
