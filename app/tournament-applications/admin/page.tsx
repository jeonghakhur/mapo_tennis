'use client';
import { useState, useEffect } from 'react';
import { Box, Text, Button, Flex, Badge, Select, Popover, TextField } from '@radix-ui/themes';
import { Filter } from 'lucide-react';
import Container from '@/components/Container';
import { useUser } from '@/hooks/useUser';
import { isAdmin } from '@/lib/authUtils';
import {
  useAdminTournamentApplications,
  useUpdateApplicationStatus,
  useDeleteApplication,
} from '@/hooks/useTournamentApplications';
import { useRouter } from 'next/navigation';
import type { TournamentApplication } from '@/model/tournamentApplication';

import SkeletonCard from '@/components/SkeletonCard';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useSession } from 'next-auth/react';
import { AlertCircle } from 'lucide-react';
import { useTournaments } from '@/hooks/useTournaments';

export default function TournamentApplicationsAdminPage() {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [tournamentFilter, setTournamentFilter] = useState<string>('all');
  const [clubMismatchFilter, setClubMismatchFilter] = useState<'all' | 'only' | 'exclude'>('all');
  const [participantNameSearch, setParticipantNameSearch] = useState('');
  const router = useRouter();
  const { data: session } = useSession();
  const { user } = useUser(session?.user?.email);
  const { applications, isLoading } = useAdminTournamentApplications();
  const { tournaments } = useTournaments();
  const { trigger: updateStatus, isMutating: isUpdating } = useUpdateApplicationStatus();
  const { trigger: deleteApplication, isMutating: isDeleting } = useDeleteApplication();

  const [selectedApplication, setSelectedApplication] = useState<TournamentApplication | null>(
    null,
  );
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // 관리자 권한 확인
  const admin = isAdmin(user);

  useEffect(() => {
    if (admin) {
      // fetchApplications(); // This function is not defined in the original file, so it's removed.
    }
  }, [admin]);

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
    // 대회 필터
    if (tournamentFilter !== 'all' && application.tournamentId !== tournamentFilter) {
      return false;
    }
    // 상태 필터
    if (filterStatus !== 'all' && application.status !== filterStatus) {
      return false;
    }
    // 클럽 불일치 필터
    const hasMismatch = application.teamMembers.some(
      (m) => m.clubName !== application.teamMembers[0].clubName,
    );
    if (clubMismatchFilter === 'only' && !hasMismatch) return false;
    if (clubMismatchFilter === 'exclude' && hasMismatch) return false;
    // 참가자 이름 검색
    if (participantNameSearch.trim()) {
      const search = participantNameSearch.trim().toLowerCase();
      const found = application.teamMembers.some((m) => m.name.toLowerCase().includes(search));
      if (!found) return false;
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
  if (!admin) return;

  return (
    <Container>
      {isLoading ? (
        <SkeletonCard />
      ) : (
        <Box>
          <Flex gap="3" mb="4" align="center" justify="between">
            {/* 기본 대회 필터 */}
            <Flex gap="3" align="center">
              <Text size="3" weight="bold">
                대회:
              </Text>
              <Select.Root size="3" value={tournamentFilter} onValueChange={setTournamentFilter}>
                <Select.Trigger placeholder="전체 대회" />
                <Select.Content>
                  <Select.Item value="all">전체</Select.Item>
                  {tournaments.map((t) => (
                    <Select.Item key={t._id} value={t._id}>
                      {t.title}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </Flex>

            {/* 필터 아이콘 */}
            <Popover.Root>
              <Popover.Trigger>
                <Button variant="soft" size="3">
                  <Filter size={16} />
                  <Text size="2">필터</Text>
                </Button>
              </Popover.Trigger>
              <Popover.Content className="w-80">
                <div className="space-y-4 p-2">
                  <Text size="3" weight="bold">
                    고급 필터
                  </Text>

                  {/* 상태 필터 */}
                  <div className="flex items-center pt-3">
                    <Text size="3" weight="bold" mr="4">
                      상태
                    </Text>
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
                  </div>

                  {/* 클럽 불일치 필터 */}
                  <div className="flex items-center">
                    <Text size="3" weight="bold" mr="4">
                      클럽
                    </Text>
                    <Select.Root
                      size="3"
                      value={clubMismatchFilter}
                      onValueChange={(v) => setClubMismatchFilter(v as 'all' | 'only' | 'exclude')}
                    >
                      <Select.Trigger placeholder="전체" />
                      <Select.Content>
                        <Select.Item value="all">전체</Select.Item>
                        <Select.Item value="only">불일치만</Select.Item>
                        <Select.Item value="exclude">불일치 제외</Select.Item>
                      </Select.Content>
                    </Select.Root>
                  </div>

                  {/* 참가자 이름 검색 */}
                  <div className="flex items-center">
                    <Text size="3" weight="bold" mr="4">
                      이름
                    </Text>
                    <TextField.Root
                      size="3"
                      type="text"
                      value={participantNameSearch}
                      onChange={(e) => setParticipantNameSearch(e.target.value)}
                      placeholder="이름을 입력하세요"
                    />
                  </div>
                </div>
              </Popover.Content>
            </Popover.Root>
          </Flex>

          {filteredApplications.length === 0 ? (
            <div className="p-6 text-center">
              <Text size="3" color="gray">
                참가 신청 내역이 없습니다.
              </Text>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredApplications.map((application) => (
                <div
                  key={application._id}
                  className="border rounded p-4"
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
                      <Text size="4" weight="bold" mb="2" as="div">
                        {application.tournament?.title} - {getDivisionLabel(application.division)}
                      </Text>

                      {/* 단체전인 경우 클럽명을 한 번만 표시 */}
                      {application.tournamentType === 'team' && (
                        <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-500">
                          <Text size="2" weight="bold" color="gray">
                            참가 클럽
                          </Text>
                          <Text size="3" weight="bold" color="blue">
                            {application.teamMembers[0]?.clubName || '-'}
                          </Text>
                        </div>
                      )}

                      {/* 참가자 목록 */}
                      <div className="space-y-2">
                        <Text size="3" weight="bold">
                          참가자 목록 ({application.teamMembers.length}명)
                        </Text>
                        <div className="grid gap-2 pt-3">
                          {application.teamMembers.map((member, index) => (
                            <div
                              key={index}
                              className={`p-3 rounded ${
                                application.tournamentType === 'individual'
                                  ? 'bg-gray-50 grid grid-cols-1 md:grid-cols-3 gap-4'
                                  : 'bg-gray-50 flex items-center justify-between'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <Text size="2" weight="bold" color="gray">
                                  {index + 1}번
                                </Text>
                                <Text size="3" weight="bold">
                                  {member.name}
                                </Text>
                                {/* 클럽 불일치 표시 (어드민 전용) */}
                                {member.clubName !== application.teamMembers[0].clubName && (
                                  <span className="text-orange-600 flex items-center">
                                    <AlertCircle size={14} className="mr-1" />
                                    <span className="text-xs">클럽 불일치</span>
                                  </span>
                                )}
                              </div>

                              {/* 개인전인 경우에만 클럽명 표시 */}
                              {application.tournamentType === 'individual' && (
                                <div>
                                  <Text size="2" weight="bold" color="gray">
                                    클럽
                                  </Text>
                                  <Text size="3">{member.clubName}</Text>
                                </div>
                              )}

                              <div>
                                <Text size="2" weight="bold" color="gray">
                                  점수
                                </Text>
                                <Text size="3">{member.score || '-'}</Text>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 연락처 정보와 참가비 납부 여부를 좌우로 배치 */}
                    <div className="flex gap-4 flex-col ">
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
                        disabled={isUpdating}
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
                        disabled={isUpdating}
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
                </div>
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
