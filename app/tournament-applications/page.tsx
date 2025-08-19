'use client';
import { Box, Text, Button, Flex, Badge, Card, Select, Heading } from '@radix-ui/themes';
import Container from '@/components/Container';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
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

export default function TournamentApplicationsPage() {
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('');
  const [divisionFilter, setDivisionFilter] = useState<string>('all');
  const router = useRouter();
  const { data: session } = useSession();
  const { user } = useUser(session?.user?.email);

  // 대회 정보 먼저 가져오기 (사용자 권한에 따라 다른 대회 목록)
  const { tournaments, isLoading: tournamentsLoading } = useTournamentsByUserLevel(user?.level);
  const { trigger: updateStatus } = useUpdateApplicationStatus();

  const [selectedApplication, setSelectedApplication] = useState<TournamentApplication | null>(
    null,
  );
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // 로컬 상태로 applications 관리
  const [applications, setApplications] = useState<TournamentApplication[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);

  // 각 신청별 개별 로딩 상태 관리
  const [updatingApplications, setUpdatingApplications] = useState<Set<string>>(new Set());

  // 선택된 대회 ID가 변경될 때 데이터 가져오기
  useEffect(() => {
    if (selectedTournamentId) {
      setApplicationsLoading(true);
      fetch(`/api/tournament-applications?tournamentId=${selectedTournamentId}`)
        .then((response) => response.json())
        .then((data) => {
          setApplications(data);
          setApplicationsLoading(false);
        })
        .catch((error) => {
          console.error('Failed to fetch applications:', error);
          setApplicationsLoading(false);
        });
    }
  }, [selectedTournamentId]);
  // applications에서 나의 신청 내역 필터링
  const myApplications = applications.filter((app) => app.createdBy === user?._id);

  // 페이지 진입 시 첫 번째 대회를 자동으로 선택
  useEffect(() => {
    if (tournaments.length > 0 && !selectedTournamentId) {
      const firstTournament = tournaments[0]; // 첫 번째 대회 (최근 등록된 대회)
      setSelectedTournamentId(firstTournament._id);
    }
  }, [tournaments, selectedTournamentId]);

  // 선택된 대회 이름 가져오기
  const getSelectedTournamentName = () => {
    const selectedTournament = tournaments.find((t) => t._id === selectedTournamentId);
    return selectedTournament?.title || '대회를 선택하세요';
  };

  // 대회ID+부서별 전체 참가팀 수 계산
  const getDivisionTeamCount = (tournamentId: string, division: string) =>
    applications.filter((app) => app.tournamentId === tournamentId && app.division === division)
      .length;

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, 'red' | 'blue' | 'green' | 'gray'> = {
      pending: 'blue',
      approved: 'green',
      rejected: 'red',
      cancelled: 'gray',
    };
    return colorMap[status] || 'gray';
  };

  const getStatusLabel = (status: string) => {
    const labelMap: Record<string, string> = {
      pending: '대기중',
      approved: '승인',
      rejected: '거절',
      cancelled: '취소',
    };
    return labelMap[status] || status;
  };

  const getDivisionLabel = (division: string) => {
    const divisionLabels: Record<string, string> = {
      master: '마스터부',
      challenger: '챌린저부',
      futures: '퓨처스부',
      chrysanthemum: '국화부',
      forsythia: '개나리부',
    };
    return divisionLabels[division] || division;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'yy.MM.dd HH:mm', { locale: ko });
  };

  const handleStatusUpdate = async (applicationId: string, newStatus: string) => {
    try {
      console.log('상태 업데이트 시작:', { applicationId, newStatus });
      console.log('현재 사용자 정보:', { user: user?._id, level: user?.level });

      // 개별 로딩 상태 시작
      setUpdatingApplications((prev) => new Set(prev).add(applicationId));

      // Optimistic update: 즉시 UI 업데이트 (더 정확한 상태로)
      setApplications((prevApplications) =>
        prevApplications.map((app) =>
          app._id === applicationId
            ? {
                ...app,
                status: newStatus as 'pending' | 'approved' | 'rejected' | 'cancelled',
                updatedAt: new Date().toISOString(), // 업데이트 시간도 즉시 반영
              }
            : app,
        ),
      );

      // API 호출
      const response = await fetch(`/api/tournament-applications/${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.details || errorData.error || response.statusText;
        throw new Error(`상태 업데이트에 실패했습니다. (${response.status}): ${errorMessage}`);
      }

      const result = await response.json();
      console.log('상태 업데이트 성공:', result);
      setShowConfirmDialog(false);

      // 성공 시 서버 응답으로 최종 상태 동기화
      setApplications((prevApplications) =>
        prevApplications.map((app) =>
          app._id === applicationId
            ? {
                ...app,
                ...result,
                status: newStatus as 'pending' | 'approved' | 'rejected' | 'cancelled',
              }
            : app,
        ),
      );
    } catch (error) {
      console.error('상태 업데이트 실패:', error);

      // 실패 시 원래 상태로 되돌리기
      setApplications((prevApplications) =>
        prevApplications.map((app) =>
          app._id === applicationId
            ? { ...app, status: 'pending' } // 기본 상태로 되돌리기
            : app,
        ),
      );

      alert(
        `상태 업데이트에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      );
    } finally {
      // 개별 로딩 상태 종료
      setUpdatingApplications((prev) => {
        const newSet = new Set(prev);
        newSet.delete(applicationId);
        return newSet;
      });
    }
  };

  const openStatusDialog = (application: TournamentApplication, status: string) => {
    setSelectedApplication(application);
    setSelectedStatus(status);
    setShowConfirmDialog(true);
  };

  // 대회 선택 변경 시 해당 대회의 신청만 가져오기
  const handleTournamentChange = (tournamentId: string) => {
    console.log('applications', applications);
    setSelectedTournamentId(tournamentId);
    setDivisionFilter('all'); // 부서 필터 초기화
  };

  const filteredApplications = applications
    .filter((application) => {
      // 부서 필터만 적용 (대회 필터는 이미 API에서 처리됨)
      if (divisionFilter !== 'all' && application.division !== divisionFilter) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      // 1. 부서별로 정렬
      if (a.division !== b.division) {
        return a.division.localeCompare(b.division);
      }
      // 2. 같은 부서 내에서는 최신 신청이 먼저 표시되도록 정렬
      return (b.applicationOrder || 0) - (a.applicationOrder || 0);
    });

  return (
    <Container>
      {tournamentsLoading || applicationsLoading ? (
        <SkeletonCard />
      ) : (
        <Box>
          {/* 필터 */}
          <Box mb="6">
            <Flex gap="3" mb="4" align="center" wrap="wrap">
              <Flex gap="3" align="center">
                <Select.Root
                  value={selectedTournamentId}
                  onValueChange={handleTournamentChange}
                  size="3"
                >
                  <Select.Trigger placeholder={getSelectedTournamentName()} />
                  <Select.Content>
                    {tournaments.map((tournament) => (
                      <Select.Item key={tournament._id} value={tournament._id}>
                        {tournament.title}
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
                    {Array.from(
                      new Set(
                        applications
                          .filter((app) => app.tournamentId === selectedTournamentId)
                          .map((app) => app.division),
                      ),
                    ).map((division) => (
                      <Select.Item key={division} value={division}>
                        {getDivisionLabel(division)}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </Flex>
            </Flex>
          </Box>

          {/* 나의 신청 내역 */}
          {myApplications.length > 0 && (
            <Box mb="6">
              <Heading size="4" mb="3">
                나의신청내역
              </Heading>
              <div className="space-y-4">
                {myApplications.map((application) => (
                  <Card
                    key={application._id}
                    className={`p-6 transition-colors ${
                      application.createdBy === user?._id || hasPermissionLevel(user, 4)
                        ? 'cursor-pointer hover:bg-gray-50'
                        : ''
                    }`}
                    onClick={() => {
                      if (application.createdBy === user?._id || hasPermissionLevel(user, 4)) {
                        router.push(`/tournament-applications/${application._id}/edit`);
                      }
                    }}
                  >
                    <div className="space-y-4">
                      {/* 헤더 */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge color={getStatusColor(application.status)}>
                            {getStatusLabel(application.status)}
                          </Badge>
                          {application.applicationOrder && (
                            <Badge color="blue">{application.applicationOrder}번째 신청</Badge>
                          )}
                          <Badge color="blue" style={{ fontWeight: 500 }}>
                            현재
                            {getDivisionTeamCount(application.tournamentId, application.division)}팀
                            신청
                          </Badge>
                        </div>
                        <Text color="gray" size="2">
                          {formatDate(application.createdAt)}
                        </Text>
                      </div>

                      {/* 참가자 정보 */}
                      <div className="space-y-3">
                        <Text size="4" weight="bold" mb="2" as="div">
                          {application.tournament?.title || `대회 ID: ${application.tournamentId}`}{' '}
                          - {getDivisionLabel(application.division)}
                        </Text>

                        <div className="space-y-3">
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
                                    {member.name}
                                    {application.tournamentType === 'individual' && (
                                      <>
                                        {' / '}
                                        {member.clubName}
                                      </>
                                    )}
                                  </Text>
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
                        </div>
                      </div>

                      {/* 참가비 납부 여부 */}
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

                      {/* 메모 */}
                      {application.memo && (
                        <div>
                          <Text weight="bold">메모</Text>
                          <Text className="block mt-1">{application.memo}</Text>
                        </div>
                      )}

                      {/* 액션 버튼 */}
                      <Flex gap="3" justify="end" pt="4" className="border-t">
                        <Button
                          variant="soft"
                          onClick={() => {
                            const tournamentId = application.tournamentId;
                            if (tournamentId && tournamentId.trim() !== '') {
                              router.push(`/tournaments/${tournamentId as string}`);
                            }
                          }}
                        >
                          대회 상세보기
                        </Button>
                        {/* 본인의 신청이거나 관리자인 경우에만 수정 가능 */}
                        {(application.createdBy === user?._id || hasPermissionLevel(user, 4)) && (
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

          {/* 전체 참가 신청 목록 */}
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
                {/* 부서별로 그룹핑 */}
                {(() => {
                  const groupedByDivision: Record<string, TournamentApplication[]> = {};

                  filteredApplications.forEach((application) => {
                    if (!groupedByDivision[application.division]) {
                      groupedByDivision[application.division] = [];
                    }
                    groupedByDivision[application.division].push(application);
                  });

                  return Object.entries(groupedByDivision)
                    .sort(([a], [b]) => a.localeCompare(b)) // 부서명 알파벳 순 정렬
                    .map(([division, applications]) => (
                      <Box key={division}>
                        <Heading size="3" mb="3" color="blue">
                          {getDivisionLabel(division)} ({applications.length}팀 신청)
                        </Heading>
                        <div className="space-y-4">
                          {applications.map((application) => (
                            <Card
                              key={application._id}
                              className={`p-6 transition-colors ${
                                application.createdBy === user?._id || hasPermissionLevel(user, 4)
                                  ? 'cursor-pointer hover:bg-gray-50'
                                  : ''
                              }`}
                              onClick={() => {
                                // 본인의 신청이거나 관리자인 경우에만 수정 페이지로 이동
                                if (
                                  application.createdBy === user?._id ||
                                  hasPermissionLevel(user, 4)
                                ) {
                                  router.push(`/tournament-applications/${application._id}/edit`);
                                }
                              }}
                            >
                              <div className="space-y-4">
                                {/* 헤더 */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {hasPermissionLevel(user, 4) && (
                                      <Badge color={getStatusColor(application.status)}>
                                        {getStatusLabel(application.status)}
                                      </Badge>
                                    )}
                                    {application.applicationOrder && (
                                      <Badge color="blue">
                                        {application.applicationOrder}번째 신청
                                      </Badge>
                                    )}
                                  </div>
                                  <Text color="gray" size="2">
                                    {formatDate(application.createdAt)}
                                  </Text>
                                </div>

                                {/* 참가자 정보 */}
                                <div className="space-y-3">
                                  {application.tournamentType === 'team' && (
                                    <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-500">
                                      <Text weight="bold" color="gray" mr="2">
                                        참가 클럽
                                      </Text>
                                      <Text weight="bold" color="blue">
                                        {application.teamMembers[0]?.clubName || '-'}
                                      </Text>
                                      <Text weight="bold">
                                        ({application.teamMembers.length}명)
                                      </Text>
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
                                            {hasPermissionLevel(user, 4)
                                              ? member.name
                                              : member.name.charAt(0) +
                                                '*'.repeat(member.name.length - 1)}
                                            {application.tournamentType === 'individual' && (
                                              <>
                                                {' / '}
                                                {member.clubName}
                                              </>
                                            )}
                                          </Text>
                                          {/* 관리자용 회원등록 여부 표시 */}
                                          {hasPermissionLevel(user, 4) && (
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
                                </div>

                                {/* 관리자용 참가비 납부 여부 */}
                                {hasPermissionLevel(user, 4) && (
                                  <div className="flex items-center justify-between">
                                    <Text weight="bold">참가비 납부</Text>
                                    <div className="flex items-center gap-2">
                                      <div
                                        className={`w-4 h-4 rounded-full ${application.isFeePaid ? 'bg-green-500' : 'bg-red-500'}`}
                                      />
                                      <Text
                                        weight="bold"
                                        color={application.isFeePaid ? 'green' : 'red'}
                                      >
                                        {application.isFeePaid ? '납부 완료' : '미납'}
                                      </Text>
                                    </div>
                                  </div>
                                )}

                                {/* 관리자용 액션 버튼 */}
                                {hasPermissionLevel(user, 4) && (
                                  <div className="btn-wrap border-t pt-4">
                                    <Button
                                      variant="soft"
                                      color="red"
                                      size="2"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openStatusDialog(application, 'rejected');
                                      }}
                                      disabled={
                                        updatingApplications.has(application._id || '') ||
                                        application.status === 'rejected'
                                      }
                                    >
                                      {updatingApplications.has(application._id || '')
                                        ? '처리중...'
                                        : '거절'}
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
                                        updatingApplications.has(application._id || '') ||
                                        application.status === 'approved'
                                      }
                                    >
                                      {updatingApplications.has(application._id || '')
                                        ? '처리중...'
                                        : '승인'}
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </Card>
                          ))}
                        </div>
                      </Box>
                    ));
                })()}
              </div>
            )}
          </Box>
        </Box>
      )}

      {/* 상태 변경 확인 다이얼로그 */}
      <ConfirmDialog
        title="상태 변경"
        description={`이 신청을 ${getStatusLabel(selectedStatus)}로 변경하시겠습니까?`}
        confirmText="변경"
        cancelText="취소"
        confirmColor={selectedStatus === 'approved' ? 'green' : 'red'}
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onConfirm={() => {
          if (selectedApplication && selectedApplication._id && selectedStatus) {
            handleStatusUpdate(selectedApplication._id, selectedStatus);
          }
          setShowConfirmDialog(false);
        }}
        onCancel={() => setShowConfirmDialog(false)}
      />
    </Container>
  );
}
