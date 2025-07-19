import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import { mutate } from 'swr';
import type { TournamentApplication } from '@/model/tournamentApplication';

// 참가 신청 목록 조회
export function useTournamentApplications(tournamentId?: string) {
  const { data, error, isLoading, mutate } = useSWR<TournamentApplication[]>(
    tournamentId ? `/api/tournament-applications?tournamentId=${tournamentId}` : null,
    null,
  );

  return {
    applications: data || [],
    isLoading,
    error,
    mutate,
  };
}

// 사용자별 참가 신청 목록 조회
export function useUserTournamentApplications() {
  const { data, error, isLoading, mutate } = useSWR<TournamentApplication[]>(
    '/api/tournament-applications/user',
    null,
  );

  return {
    applications: data || [],
    isLoading,
    error,
    mutate,
  };
}

// 참가 신청 상태 업데이트
export function useUpdateApplicationStatus() {
  return useSWRMutation(
    '/api/tournament-applications',
    async (
      url,
      { arg }: { arg: { id: string; status: 'pending' | 'approved' | 'rejected' | 'cancelled' } },
    ) => {
      const response = await fetch(`${url}/${arg.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: arg.status }),
      });

      if (!response.ok) {
        throw new Error('상태 업데이트에 실패했습니다.');
      }

      return response.json();
    },
    {
      onSuccess: () => {
        // 캐시 무효화
        mutate('/api/tournament-applications');
        mutate('/api/tournament-applications/user');
        mutate('/api/tournament-applications/admin');
      },
    },
  );
}

// 관리자용 전체 참가 신청 목록 조회
export function useAdminTournamentApplications() {
  const { data, error, isLoading, mutate } = useSWR<TournamentApplication[]>(
    '/api/tournament-applications/admin',
    null,
  );

  return {
    applications: data || [],
    isLoading,
    error,
    mutate,
  };
}

// 참가 신청 삭제
export function useDeleteApplication() {
  return useSWRMutation(
    '/api/tournament-applications',
    async (url, { arg }: { arg: { id: string } }) => {
      const response = await fetch(`${url}/${arg.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('삭제에 실패했습니다.');
      }

      return response.json();
    },
    {
      onSuccess: () => {
        // 캐시 무효화
        mutate('/api/tournament-applications');
        mutate('/api/tournament-applications/user');
        mutate('/api/tournament-applications/admin');
      },
    },
  );
}
