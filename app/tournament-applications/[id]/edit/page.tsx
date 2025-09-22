'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Container from '@/components/Container';
import LoadingOverlay from '@/components/LoadingOverlay';
import TournamentApplicationForm from '@/components/TournamentApplicationForm';
import type { TournamentApplication } from '@/model/tournamentApplication';
import type { Tournament } from '@/model/tournament';
import { Button, AlertDialog, Flex } from '@radix-ui/themes';
import { useUser } from '@/hooks/useUser';
import { isAdmin } from '@/lib/authUtils';

export default function EditTournamentApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const { user } = useUser(session?.user?.email);
  const [application, setApplication] = useState<TournamentApplication | null>(null);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // 관리자 권한 확인
  const admin = isAdmin(user);

  useEffect(() => {
    async function fetchApplication() {
      try {
        const response = await fetch(`/api/tournament-applications/${id}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '참가신청을 불러올 수 없습니다.');
        }

        const applicationData = await response.json();
        setApplication(applicationData);

        // 대회 정보도 함께 가져오기
        if (applicationData.tournamentId) {
          const tournamentResponse = await fetch(
            `/api/tournaments/${applicationData.tournamentId}`,
          );
          if (tournamentResponse.ok) {
            const tournamentData = await tournamentResponse.json();
            setTournament(tournamentData);
          }
        }
      } catch (error) {
        console.error('참가신청 로드 오류:', error);
        setError(error instanceof Error ? error.message : '참가신청을 불러올 수 없습니다.');
      } finally {
        setIsLoading(false);
      }
    }

    if (session?.user?.email) {
      fetchApplication();
    }
  }, [id, session?.user?.email]);

  const handleCancel = () => {
    // 토너먼트 아이디와 부서를 파라미터로 전달하여 목록으로 이동
    if (application?.tournamentId && application?.division) {
      const params = new URLSearchParams();
      params.set('tournamentId', application.tournamentId);
      params.set('division', application.division);
      router.push(`/tournament-applications?${params.toString()}`);
    } else {
      router.push('/tournament-applications');
    }
  };

  const handleApplicationCancel = async () => {
    if (!application) return;

    setIsCancelling(true);
    try {
      const response = await fetch(`/api/tournament-applications/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '참가신청 취소에 실패했습니다.');
      }

      // 성공적으로 취소되면 목록 페이지로 이동 (파라미터 포함)
      if (application.tournamentId && application.division) {
        const params = new URLSearchParams();
        params.set('tournamentId', application.tournamentId);
        params.set('division', application.division);
        router.push(`/tournament-applications?${params.toString()}`);
      } else {
        router.push('/tournament-applications');
      }
    } catch (error) {
      console.error('참가신청 취소 오류:', error);
      setError(error instanceof Error ? error.message : '참가신청 취소에 실패했습니다.');
    } finally {
      setIsCancelling(false);
      setShowCancelDialog(false);
    }
  };

  const handleApplicationDelete = async () => {
    if (!application) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/tournament-applications/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '참가신청 삭제에 실패했습니다.');
      }

      // 성공적으로 삭제되면 목록 페이지로 이동 (파라미터 포함)
      if (application.tournamentId && application.division) {
        const params = new URLSearchParams();
        params.set('tournamentId', application.tournamentId);
        params.set('division', application.division);
        router.push(`/tournament-applications?${params.toString()}`);
      } else {
        router.push('/tournament-applications');
      }
    } catch (error) {
      console.error('참가신청 삭제 오류:', error);
      setError(error instanceof Error ? error.message : '참가신청 삭제에 실패했습니다.');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (isLoading) {
    return (
      <Container>
        <LoadingOverlay size="3" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <div className="text-center py-8">
          <h1 className="text-xl font-bold text-red-600 mb-4">오류</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => {
              if (application?.tournamentId && application?.division) {
                const params = new URLSearchParams();
                params.set('tournamentId', application.tournamentId);
                params.set('division', application.division);
                router.push(`/tournament-applications?${params.toString()}`);
              } else {
                router.push('/tournament-applications');
              }
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            목록으로 돌아가기
          </button>
        </div>
      </Container>
    );
  }

  if (!application || !tournament) {
    return (
      <Container>
        <div className="text-center py-8">
          <h1 className="text-xl font-bold text-gray-600 mb-4">참가신청을 찾을 수 없습니다</h1>
          <button
            onClick={() => {
              if (application?.tournamentId && application?.division) {
                const params = new URLSearchParams();
                params.set('tournamentId', application.tournamentId);
                params.set('division', application.division);
                router.push(`/tournament-applications?${params.toString()}`);
              } else {
                router.push('/tournament-applications');
              }
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            목록으로 돌아가기
          </button>
        </div>
      </Container>
    );
  }

  // 일반 사용자는 승인된 신청 수정 불가
  if (!admin && application.status === 'approved') {
    return (
      <Container>
        <div className="text-center py-8">
          <h1 className="text-xl font-bold text-red-600 mb-4">수정 불가</h1>
          <p className="text-gray-600 mb-4">승인된 참가신청은 수정할 수 없습니다.</p>
          <button
            onClick={() => {
              if (application?.tournamentId && application?.division) {
                const params = new URLSearchParams();
                params.set('tournamentId', application.tournamentId);
                params.set('division', application.division);
                router.push(`/tournament-applications?${params.toString()}`);
              } else {
                router.push('/tournament-applications');
              }
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            목록으로 돌아가기
          </button>
        </div>
      </Container>
    );
  }

  // 일반 사용자는 취소된 신청 수정 불가
  if (!admin && application.status === 'cancelled') {
    return (
      <Container>
        <div className="text-center py-8">
          <h1 className="text-xl font-bold text-red-600 mb-4">수정 불가</h1>
          <p className="text-gray-600 mb-4">취소된 참가신청은 수정할 수 없습니다.</p>
          <button
            onClick={() => router.push('/tournament-applications')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            목록으로 돌아가기
          </button>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="mb-6">
        <Flex gap="3" justify="between" align="center">
          <Flex gap="3" align="center">
            <Flex gap="3">
              <AlertDialog.Root open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <AlertDialog.Trigger>
                  <Button color="red" disabled={isCancelling}>
                    {isCancelling ? '취소 중...' : '참가신청 취소'}
                  </Button>
                </AlertDialog.Trigger>
                <AlertDialog.Content>
                  <AlertDialog.Title>참가신청 취소</AlertDialog.Title>
                  <AlertDialog.Description>
                    정말로 이 참가신청을 취소하시겠습니까? 취소 후에는 되돌릴 수 없습니다.
                  </AlertDialog.Description>
                  <Flex gap="3" mt="4" justify="end">
                    <AlertDialog.Cancel>
                      <Button variant="soft" color="gray">
                        취소
                      </Button>
                    </AlertDialog.Cancel>
                    <AlertDialog.Action>
                      <Button color="red" onClick={handleApplicationCancel}>
                        확인
                      </Button>
                    </AlertDialog.Action>
                  </Flex>
                </AlertDialog.Content>
              </AlertDialog.Root>

              <AlertDialog.Root open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialog.Trigger>
                  <Button color="red" variant="soft" disabled={isDeleting}>
                    {isDeleting ? '삭제 중...' : '참가신청 삭제'}
                  </Button>
                </AlertDialog.Trigger>
                <AlertDialog.Content>
                  <AlertDialog.Title>참가신청 삭제</AlertDialog.Title>
                  <AlertDialog.Description>
                    정말로 이 참가신청을 삭제하시겠습니까? 삭제 후에는 복구할 수 없습니다.
                  </AlertDialog.Description>
                  <Flex gap="3" mt="4" justify="end">
                    <AlertDialog.Cancel>
                      <Button variant="soft" color="gray">
                        취소
                      </Button>
                    </AlertDialog.Cancel>
                    <AlertDialog.Action>
                      <Button color="red" onClick={handleApplicationDelete}>
                        삭제
                      </Button>
                    </AlertDialog.Action>
                  </Flex>
                </AlertDialog.Content>
              </AlertDialog.Root>
            </Flex>
          </Flex>
        </Flex>
      </div>

      <TournamentApplicationForm
        tournament={tournament}
        onCancel={handleCancel}
        isEdit={true}
        applicationId={id}
        initialData={application}
      />
    </Container>
  );
}
