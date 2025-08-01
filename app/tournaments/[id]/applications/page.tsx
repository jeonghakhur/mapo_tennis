'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Box, Text, Button, Flex, Badge, Select } from '@radix-ui/themes';
import Container from '@/components/Container';
import { useTournament } from '@/hooks/useTournaments';
import { useUser } from '@/hooks/useUser';
import { useSession } from 'next-auth/react';
import { isAdmin } from '@/lib/authUtils';
import { Check, X, Clock, AlertCircle } from 'lucide-react';
import type { TournamentApplication } from '@/model/tournamentApplication';

interface TournamentApplicationWithDetails extends TournamentApplication {
  tournament?: {
    _id: string;
    title: string;
    location: string;
    startDate: string;
    endDate: string;
  };
  applicant?: {
    _id: string;
    name: string;
    email: string;
  };
  applicationOrder?: number;
}

export default function TournamentApplicationsPage() {
  const params = useParams();
  const { id } = params;
  const { tournament, isLoading: tournamentLoading } = useTournament(id as string);
  const { data: session } = useSession();
  const { user } = useUser(session?.user?.email);
  const [applications, setApplications] = useState<TournamentApplicationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  // 관리자 권한 확인
  const admin = isAdmin(user);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tournament-applications?tournamentId=${id}`);
      if (response.ok) {
        const data = await response.json();
        setApplications(data);
      }
    } catch (error) {
      console.error('참가신청 목록 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id && admin) {
      fetchApplications();
    }
  }, [id, admin, fetchApplications]);

  const updateApplicationStatus = async (applicationId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tournament-applications/${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // 목록 새로고침
        await fetchApplications();
      } else {
        const errorData = await response.json();
        alert(errorData.error || '상태 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('상태 변경 오류:', error);
      alert('상태 변경에 실패했습니다.');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <Check size={16} className="text-green-500" />;
      case 'rejected':
        return <X size={16} className="text-red-500" />;
      case 'cancelled':
        return <AlertCircle size={16} className="text-orange-500" />;
      default:
        return <Clock size={16} className="text-blue-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge color="green">승인</Badge>;
      case 'rejected':
        return <Badge color="red">거절</Badge>;
      case 'cancelled':
        return <Badge color="orange">취소</Badge>;
      default:
        return <Badge color="blue">대기중</Badge>;
    }
  };

  if (!session) {
    return (
      <Container>
        <Text>로그인이 필요합니다.</Text>
      </Container>
    );
  }

  if (!admin) {
    return (
      <Container>
        <Text>관리자 권한이 필요합니다.</Text>
      </Container>
    );
  }

  if (tournamentLoading) {
    return (
      <Container>
        <Text>로딩 중...</Text>
      </Container>
    );
  }

  if (!tournament) {
    return (
      <Container>
        <Text>대회를 찾을 수 없습니다.</Text>
      </Container>
    );
  }

  return (
    <Container>
      <Box>
        <Flex align="center" justify="between" mb="4">
          <Text size="6" weight="bold">
            {tournament.title} - 참가신청 관리
          </Text>
          <Button onClick={fetchApplications} disabled={loading}>
            새로고침
          </Button>
        </Flex>

        {loading ? (
          <Text>참가신청 목록을 불러오는 중...</Text>
        ) : applications.length === 0 ? (
          <Box className="text-center py-8">
            <Text size="4" color="gray">
              아직 참가신청이 없습니다.
            </Text>
          </Box>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
              <div key={application._id} className="p-4 border rounded-lg bg-white shadow-sm">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusBadge(application.status)}
                      <Text weight="bold" size="3">
                        {application.division}부 -{' '}
                        {application.tournamentType === 'individual' ? '개인전' : '단체전'}
                      </Text>
                      {application.applicationOrder && (
                        <Badge color="gray" size="1">
                          {application.applicationOrder}번째 신청
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-1 text-sm">
                      <Text color="gray">
                        신청자: {application.applicant?.name || '알 수 없음'}
                      </Text>

                      <Text color="gray">참가자: {application.teamMembers.length}명</Text>
                      {application.memo && <Text color="gray">메모: {application.memo}</Text>}
                      <Text color="gray">
                        참가비 납부: {application.isFeePaid ? '완료' : '미완료'}
                      </Text>
                    </div>

                    <div className="mt-3">
                      <Text size="2" weight="bold" className="block mb-1">
                        참가자 목록:
                      </Text>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {application.teamMembers.map((member, index) => (
                          <div key={index} className="p-2 bg-gray-50 rounded">
                            <Text weight="bold">{member.name}</Text>
                            <Text color="gray">{member.clubName}</Text>
                            {member.birth && <Text color="gray">생년: {member.birth}</Text>}
                            {member.score !== undefined && (
                              <Text color="gray">점수: {member.score}</Text>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 min-w-[150px]">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(application.status)}
                      <Text size="2" color="gray">
                        {new Date(application.createdAt).toLocaleDateString()}
                      </Text>
                    </div>

                    <Select.Root
                      value={application.status}
                      onValueChange={(value) => updateApplicationStatus(application._id!, value)}
                    >
                      <Select.Trigger placeholder="상태 변경" />
                      <Select.Content>
                        <Select.Item value="pending">대기중</Select.Item>
                        <Select.Item value="approved">승인</Select.Item>
                        <Select.Item value="rejected">거절</Select.Item>
                        <Select.Item value="cancelled">취소</Select.Item>
                      </Select.Content>
                    </Select.Root>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Box>
    </Container>
  );
}
