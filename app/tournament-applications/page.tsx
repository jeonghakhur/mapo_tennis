'use client';
import { Box, Text, Button, Flex, Badge, Card, Select } from '@radix-ui/themes';
import Container from '@/components/Container';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useUser } from '@/hooks/useUser';
import { useUserTournamentApplications } from '@/hooks/useTournamentApplications';
import { hasPermissionLevel } from '@/lib/authUtils';
import { getAllTournamentApplications } from '@/service/tournamentApplication';
import { useEffect } from 'react';

import SkeletonCard from '@/components/SkeletonCard';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { TournamentApplication } from '@/model/tournamentApplication';

export default function TournamentApplicationsPage() {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const router = useRouter();
  const { data: session } = useSession();
  const { user } = useUser(session?.user?.email);
  const { applications, isLoading } = useUserTournamentApplications();
  const [allApplications, setAllApplications] = useState<TournamentApplication[]>([]);

  useEffect(() => {
    (async () => {
      const all = await getAllTournamentApplications();
      setAllApplications(all);
    })();
  }, []);

  if (!hasPermissionLevel(user, 1)) {
    return (
      <Container>
        <Box>
          <Text color="red">권한이 없습니다.</Text>
        </Box>
      </Container>
    );
  }

  // 대회ID+부서별 전체 참가팀 수 계산
  const getDivisionTeamCount = (tournamentId: string, division: string) =>
    allApplications.filter((app) => app.tournamentId === tournamentId && app.division === division)
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

  const filteredApplications = applications.filter((application) => {
    // 상태 필터
    if (filterStatus !== 'all' && application.status !== filterStatus) {
      return false;
    }

    return true;
  });

  return (
    <Container>
      {isLoading ? (
        <SkeletonCard />
      ) : (
        <Box>
          <Flex gap="3" mb="4" align="center" wrap="wrap">
            <Flex gap="3" align="center">
              <Text weight="bold">상태 필터:</Text>
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
              <Text color="gray">참가 신청 내역이 없습니다.</Text>
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
                      <Text color="gray" size="2">
                        {formatDate(application.createdAt)}
                      </Text>
                    </div>

                    {/* 참가자 정보 */}
                    <div className="space-y-3">
                      <Text size="4" weight="bold" mb="2" as="div">
                        {application.tournament?.title || `대회 ID: ${application.tournamentId}`} -{' '}
                        {getDivisionLabel(application.division)}
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

                    {/* 연락처 정보와 참가비 납부 여부를 좌우로 배치 */}
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
    </Container>
  );
}
