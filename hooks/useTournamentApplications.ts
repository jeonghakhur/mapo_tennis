import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import { mutate } from 'swr';
import type { TournamentApplication } from '@/model/tournamentApplication';

export function useTournamentApplications(tournamentId?: string) {
  const url = tournamentId
    ? `/api/tournament-applications?tournamentId=${tournamentId}`
    : '/api/tournament-applications';

  console.log('useTournamentApplications called with tournamentId:', tournamentId);

  const { data, error, isLoading, mutate } = useSWR<{ applications: TournamentApplication[] }>(
    tournamentId ? `tournament-applications-${tournamentId}` : 'tournament-applications-recent',
    async () => {
      console.log('Fetching from URL:', url);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch tournament applications');
      }
      const result = await response.json();
      console.log('Fetched data:', result);
      return result;
    },
    {
      refreshInterval: 30000, // 30초마다 새로고침
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 0, // 중복 요청 방지 시간을 0으로 설정
    },
  );

  return {
    applications: data?.applications || [],
    isLoading,
    error,
    mutate,
  };
}

export function useTournamentApplication(id: string) {
  const { data, error, isLoading, mutate } = useSWR<TournamentApplication>(
    id ? `/api/tournament-applications/${id}` : null,
    null,
  );

  return {
    application: data || null,
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
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.details || errorData.error || response.statusText;
        throw new Error(`상태 업데이트에 실패했습니다. (${response.status}): ${errorMessage}`);
      }

      return response.json();
    },
    {
      onSuccess: () => {
        // 캐시 무효화 - 모든 관련 API 키 무효화
        mutate('/api/tournament-applications');
        // 특정 대회의 신청 목록도 무효화
        mutate((key) => typeof key === 'string' && key.startsWith('/api/tournament-applications'));
      },
    },
  );
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
        // 캐시 무효화 - 모든 관련 API 키 무효화
        mutate('/api/tournament-applications');
        // 특정 대회의 신청 목록도 무효화
        mutate((key) => typeof key === 'string' && key.startsWith('/api/tournament-applications'));
      },
    },
  );
}
