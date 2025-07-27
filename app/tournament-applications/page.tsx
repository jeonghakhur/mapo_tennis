'use client';
import { Box, Text, Button, Flex, Badge, Card, Select, Separator } from '@radix-ui/themes';
import Container from '@/components/Container';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useUser } from '@/hooks/useUser';
import {
  useUserTournamentApplications,
  useUpdateApplicationStatus,
} from '@/hooks/useTournamentApplications';
import { isModerator } from '@/lib/authUtils';
import { getAllTournamentApplications } from '@/service/tournamentApplication';
import { useEffect } from 'react';

import SkeletonCard from '@/components/SkeletonCard';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import ConfirmDialog from '@/components/ConfirmDialog';
import type { TournamentApplication } from '@/model/tournamentApplication';

export default function TournamentApplicationsPage() {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const router = useRouter();
  const { data: session } = useSession();
  const { user } = useUser(session?.user?.email);
  const { applications, isLoading } = useUserTournamentApplications();
  const { trigger: updateStatus, isMutating } = useUpdateApplicationStatus();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<TournamentApplication | null>(
    null,
  );
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [allApplications, setAllApplications] = useState<TournamentApplication[]>([]);

  useEffect(() => {
    (async () => {
      const all = await getAllTournamentApplications();
      setAllApplications(all);
    })();
  }, []);

  // 대회ID+부서별 전체 참가팀 수 계산
  const getDivisionTeamCount = (tournamentId: string, division: string) =>
    allApplications.filter((app) => app.tournamentId === tournamentId && app.division === division)
      .length;

  // 중간 관리자 권한 확인 (레벨 4 이상)
  const canManageApplications = isModerator(user);

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

  const filteredApplications = applications.filter((application) => {
    // 상태 필터
    if (filterStatus !== 'all' && application.status !== filterStatus) {
      return false;
    }

    return true;
  });

  const handleStatusUpdate = async (applicationId: string, newStatus: string) => {
    try {
      await updateStatus({
        id: applicationId,
        status: newStatus as 'pending' | 'approved' | 'rejected' | 'cancelled',
      });
      alert('상태가 업데이트되었습니다.');
    } catch {
      alert('상태 업데이트에 실패했습니다.');
    }
  };

  const openStatusDialog = (application: TournamentApplication, status: string) => {
    setSelectedApplication(application);
    setSelectedStatus(status);
    setShowConfirmDialog(true);
  };

  console.log(applications);
  return (
    <Container>
      {isLoading ? (
        <SkeletonCard />
      ) : (
        <Box>
          <Flex gap="3" mb="4" align="center" wrap="wrap">
            <Flex gap="3" align="center">
              <Text weight="bold">상태 필터:</Text>
              <Select.Root size="3" value={filterStatus} onValueChange={setFilterStatus}>
                <Select.Trigger placeholder="전체" />
                <Select.Content>
                  <Select.Item value="all">전체</Select.Item>
                  <Select.Item value="pending">대기중</Select.Item>
                  <Select.Item value="approved">승인</Select.Item>
                  <Select.Item value="rejected">거절</Select.Item>
                  <Select.Item value="cancelled">취소</Select.Item>
                </Select.Content>
              </Select.Root>
            </Flex>
          </Flex>

          {filteredApplications.length === 0 ? (
            <Card className="p-6 text-center">
              <Text size="3" color="gray">
                참가 신청 내역이 없습니다.
              </Text>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredApplications.map((application) => (
                <Card
                  key={application._id}
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    if (application.status === 'pending' || application.status === 'rejected') {
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
                      <Text color="gray">{formatDate(application.createdAt)}</Text>
                    </div>

                    {/* 참가자 정보 */}
                    <div className="space-y-3">
                      <Text size="4" weight="bold" mb="2" as="div">
                        {application.tournament?.title || `대회 ID: ${application.tournamentId}`} -{' '}
                        {getDivisionLabel(application.division)}
                      </Text>

                      {/* 단체전과 개인전 UI 분리 */}
                      {application.tournamentType === 'team' ? (
                        // 단체전 UI
                        <div className="space-y-3">
                          {/* 단체전 클럽 정보 */}
                          <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-500">
                            <Text weight="bold" color="gray">
                              참가 클럽
                            </Text>
                            <Text size="3" weight="bold" color="blue">
                              {application.teamMembers[0]?.clubName || '-'}
                            </Text>
                          </div>

                          {/* 단체전 참가자 목록 */}
                          <div className="space-y-2">
                            <Text size="3" weight="bold">
                              참가자 목록 ({application.teamMembers.length}명)
                            </Text>
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
                                    <Text size="3" weight="bold">
                                      {member.name}
                                    </Text>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <Text weight="bold" color="gray">
                                      점수
                                    </Text>
                                    <Text size="3">{member.score || '-'}</Text>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        // 개인전 UI
                        <div className="space-y-3">
                          {/* 개인전 참가자 목록 */}
                          <div className="space-y-2">
                            <div className="grid gap-2">
                              {application.teamMembers.map((member, index) => (
                                <div key={index} className="flex gap-2">
                                  <Text size="3" weight="bold">
                                    {member.name}
                                  </Text>
                                  <Separator orientation="vertical" />

                                  <Text size="3">{member.clubName}</Text>

                                  <Separator orientation="vertical" />

                                  <Text weight="bold" color="gray">
                                    점수
                                  </Text>
                                  <Text size="3">{member.score || '-'}</Text>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 연락처 정보와 참가비 납부 여부를 좌우로 배치 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* 연락처 정보 */}
                      <div className="space-y-2">
                        <Text size="3" weight="bold">
                          연락처 정보
                        </Text>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Text weight="bold" color="gray">
                              연락처
                            </Text>
                            <Text size="3">{application.contact}</Text>
                          </div>
                          {application.email && (
                            <div>
                              <Text weight="bold" color="gray">
                                이메일
                              </Text>
                              <Text size="3">{application.email}</Text>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 참가비 납부 여부 */}
                      <div className="flex items-center justify-between">
                        <Text size="3" weight="bold">
                          참가비 납부
                        </Text>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-4 h-4 rounded-full ${application.isFeePaid ? 'bg-green-500' : 'bg-red-500'}`}
                          />
                          <Text
                            size="3"
                            weight="bold"
                            color={application.isFeePaid ? 'green' : 'red'}
                          >
                            {application.isFeePaid ? '납부 완료' : '미납'}
                          </Text>
                        </div>
                      </div>
                    </div>

                    {/* 메모 */}
                    {application.memo && (
                      <div>
                        <Text size="3" weight="bold">
                          메모
                        </Text>
                        <Text size="3" className="block mt-1">
                          {application.memo}
                        </Text>
                      </div>
                    )}

                    {/* 액션 버튼 */}
                    <Flex gap="3" justify="end" pt="4" className="border-t">
                      {application.status === 'pending' && canManageApplications && (
                        <>
                          <Button
                            variant="soft"
                            color="green"
                            onClick={() => openStatusDialog(application, 'approved')}
                            disabled={isMutating}
                          >
                            승인
                          </Button>
                          <Button
                            variant="soft"
                            color="red"
                            onClick={() => openStatusDialog(application, 'rejected')}
                            disabled={isMutating}
                          >
                            거절
                          </Button>
                        </>
                      )}
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
                      {(application.status === 'pending' || application.status === 'rejected') && (
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
          )}
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
          if (selectedApplication && selectedStatus && selectedApplication._id) {
            handleStatusUpdate(selectedApplication._id, selectedStatus);
          }
          setShowConfirmDialog(false);
        }}
        onCancel={() => setShowConfirmDialog(false)}
      />
    </Container>
  );
}
