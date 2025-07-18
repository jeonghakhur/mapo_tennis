'use client';
import { Box, Text, Button, Flex, Badge, Card, Select } from '@radix-ui/themes';
import Container from '@/components/Container';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useUser } from '@/hooks/useUser';
import {
  useUserTournamentApplications,
  useUpdateApplicationStatus,
} from '@/hooks/useTournamentApplications';

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

  // 레벨 4 이상인 사용자만 승인/거절 권한 가짐
  const canManageApplications = user?.level && user.level >= 4;

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
          <Flex align="center" justify="between" mb="4">
            <Text size="5" weight="bold">
              참가신청목록
            </Text>
            {canManageApplications && (
              <Button
                variant="soft"
                size="2"
                onClick={() => router.push('/tournament-applications/admin')}
              >
                전체 목록 보기
              </Button>
            )}
          </Flex>

          <Flex gap="3" mb="4" align="center" wrap="wrap">
            <Flex gap="3" align="center">
              <Text size="2" weight="bold">
                상태 필터:
              </Text>
              <Select.Root value={filterStatus} onValueChange={setFilterStatus}>
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
                      <div className="flex items-center gap-3">
                        <Badge color={getStatusColor(application.status)} size="2">
                          {getStatusLabel(application.status)}
                        </Badge>
                        {application.applicationOrder && (
                          <Badge color="blue" size="2">
                            {application.applicationOrder}번째 신청
                          </Badge>
                        )}
                      </div>
                      <Text size="2" color="gray">
                        {formatDate(application.createdAt)}
                      </Text>
                    </div>

                    {/* 참가자 정보 */}
                    <div className="space-y-3">
                      <Text size="4" weight="bold">
                        {application.tournament?.title || `대회 ID: ${application.tournamentId}`} -{' '}
                        {getDivisionLabel(application.division)}
                      </Text>

                      {application.teamMembers.map((member, index) => (
                        <div
                          key={index}
                          className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-gray-50 rounded"
                        >
                          <div>
                            <Text size="2" weight="bold" color="gray">
                              {index + 1}번째 참가자
                            </Text>
                            <Text size="3">{member.name}</Text>
                          </div>
                          <div>
                            <Text size="2" weight="bold" color="gray">
                              클럽
                            </Text>
                            <Text size="3">{member.clubName}</Text>
                          </div>
                          <div>
                            <Text size="2" weight="bold" color="gray">
                              점수
                            </Text>
                            <Text size="3">{member.score || '-'}</Text>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 연락처 정보 */}
                    <div className="space-y-2">
                      <Text size="3" weight="bold">
                        연락처 정보
                      </Text>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Text size="2" weight="bold" color="gray">
                            연락처
                          </Text>
                          <Text size="3">{application.contact}</Text>
                        </div>
                        {application.email && (
                          <div>
                            <Text size="2" weight="bold" color="gray">
                              이메일
                            </Text>
                            <Text size="3">{application.email}</Text>
                          </div>
                        )}
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

                    {/* 참가비 납부 여부 */}
                    <div>
                      <Text size="3" weight="bold">
                        참가비 납부
                      </Text>
                      <div className="flex items-center gap-2 mt-1">
                        <div
                          className={`w-3 h-3 rounded-full ${application.isFeePaid ? 'bg-green-500' : 'bg-red-500'}`}
                        />
                        <Text size="3" color={application.isFeePaid ? 'green' : 'red'}>
                          {application.isFeePaid ? '납부 완료' : '미납'}
                        </Text>
                      </div>
                    </div>

                    {/* 액션 버튼 */}
                    <Flex gap="3" justify="end" pt="4" className="border-t">
                      {application.status === 'pending' && canManageApplications && (
                        <>
                          <Button
                            variant="soft"
                            color="green"
                            size="2"
                            onClick={() => openStatusDialog(application, 'approved')}
                            disabled={isMutating}
                          >
                            승인
                          </Button>
                          <Button
                            variant="soft"
                            color="red"
                            size="2"
                            onClick={() => openStatusDialog(application, 'rejected')}
                            disabled={isMutating}
                          >
                            거절
                          </Button>
                        </>
                      )}
                      <Button
                        variant="soft"
                        size="2"
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
                          size="2"
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
