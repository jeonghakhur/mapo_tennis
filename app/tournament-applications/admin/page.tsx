'use client';
import { Box, Text, Button, Flex, Badge, Card, Select } from '@radix-ui/themes';
import Container from '@/components/Container';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useUser } from '@/hooks/useUser';
import {
  useAdminTournamentApplications,
  useUpdateApplicationStatus,
  useDeleteApplication,
} from '@/hooks/useTournamentApplications';

import SkeletonCard from '@/components/SkeletonCard';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import ConfirmDialog from '@/components/ConfirmDialog';
import type { TournamentApplication } from '@/model/tournamentApplication';

export default function AdminTournamentApplicationsPage() {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const router = useRouter();
  const { data: session } = useSession();
  const { user } = useUser(session?.user?.email);
  const { applications, isLoading } = useAdminTournamentApplications();
  const { trigger: updateStatus, isMutating } = useUpdateApplicationStatus();
  const { trigger: deleteApplication, isMutating: isDeleting } = useDeleteApplication();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<TournamentApplication | null>(
    null,
  );
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [isDeleteMode, setIsDeleteMode] = useState(false);

  // 레벨 5 이상인 사용자만 관리자 권한
  const isAdmin = user?.level && user.level >= 5;

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

  const handleDelete = async (applicationId: string) => {
    try {
      await deleteApplication({ id: applicationId });
      alert('참가신청이 삭제되었습니다.');
    } catch {
      alert('삭제에 실패했습니다.');
    }
  };

  const openStatusDialog = (application: TournamentApplication, status: string) => {
    setSelectedApplication(application);
    setSelectedStatus(status);
    setIsDeleteMode(false);
    setShowConfirmDialog(true);
  };

  const openDeleteDialog = (application: TournamentApplication) => {
    setSelectedApplication(application);
    setIsDeleteMode(true);
    setShowConfirmDialog(true);
  };

  // 관리자가 아닌 경우 접근 제한
  if (!isAdmin) return;

  return (
    <Container>
      {isLoading ? (
        <SkeletonCard />
      ) : (
        <Box>
          <Flex align="center" justify="between" mb="4">
            <Text size="5" weight="bold">
              전체 참가신청 목록 (관리자)
            </Text>
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
                    router.push(`/tournament-applications/${application._id}/edit`);
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
                        <Badge color="gray" size="2">
                          신청자: {application.applicant?.name || application.createdBy}
                        </Badge>
                      </div>
                      <Text size="2" color="gray">
                        {formatDate(application.createdAt)}
                      </Text>
                    </div>

                    {/* 참가자 정보 */}
                    <div className="space-y-3">
                      <Text size="4" weight="bold">
                        {application.tournament?.title} - {getDivisionLabel(application.division)}
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
                      <Button
                        variant="soft"
                        color="red"
                        size="2"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteDialog(application);
                        }}
                        disabled={isDeleting}
                      >
                        삭제
                      </Button>
                      <Button
                        variant="soft"
                        color="green"
                        size="2"
                        onClick={(e) => {
                          e.stopPropagation();
                          openStatusDialog(application, 'approved');
                        }}
                        disabled={isMutating}
                      >
                        승인
                      </Button>
                      <Button
                        variant="soft"
                        color="red"
                        size="2"
                        onClick={(e) => {
                          e.stopPropagation();
                          openStatusDialog(application, 'rejected');
                        }}
                        disabled={isMutating}
                      >
                        거절
                      </Button>
                      <Button
                        variant="soft"
                        size="2"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/tournament-applications/${application._id}/edit`);
                        }}
                      >
                        수정
                      </Button>
                      <Button
                        variant="soft"
                        size="2"
                        onClick={(e) => {
                          e.stopPropagation();
                          const tournamentId = application.tournamentId;
                          if (tournamentId && tournamentId.trim() !== '') {
                            router.push(`/tournaments/${tournamentId as string}`);
                          }
                        }}
                      >
                        대회 상세보기
                      </Button>
                    </Flex>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Box>
      )}

      {/* 상태 변경/삭제 확인 다이얼로그 */}
      <ConfirmDialog
        title={isDeleteMode ? '참가신청 삭제' : '상태 변경'}
        description={
          isDeleteMode
            ? '이 참가신청을 삭제하시겠습니까?'
            : `이 신청을 ${getStatusLabel(selectedStatus)}로 변경하시겠습니까?`
        }
        confirmText={isDeleteMode ? '삭제' : '변경'}
        cancelText="취소"
        confirmColor={isDeleteMode ? 'red' : selectedStatus === 'approved' ? 'green' : 'red'}
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onConfirm={() => {
          if (selectedApplication && selectedApplication._id) {
            if (isDeleteMode) {
              handleDelete(selectedApplication._id);
            } else if (selectedStatus) {
              handleStatusUpdate(selectedApplication._id, selectedStatus);
            }
          }
          setShowConfirmDialog(false);
        }}
        onCancel={() => setShowConfirmDialog(false)}
      />
    </Container>
  );
}
