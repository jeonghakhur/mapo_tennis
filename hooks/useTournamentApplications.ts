import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import { mutate } from 'swr';
import type { TournamentApplication } from '@/model/tournamentApplication';
import { useSWRConfig } from 'swr';

export function useTournamentApplications(tournamentId?: string) {
  const url = tournamentId
    ? `/api/tournament-applications?tournamentId=${tournamentId}`
    : '/api/tournament-applications';

  const { data, error, isLoading, mutate } = useSWR<{ applications: TournamentApplication[] }>(
    tournamentId ? `tournament-applications-${tournamentId}` : 'tournament-applications-recent',
    async () => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch tournament applications');
      }
      const result = await response.json();
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

type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

type UpdateArg = { id: string; status: ApplicationStatus };
type UpdateResult = { _id: string; status: ApplicationStatus; updatedAt: string } | null;

const appKeys = {
  all: '/api/tournament-applications',
  byId: (id: string) => `/api/tournament-applications/${id}`,
};

async function patchStatus(url: string, { arg }: { arg: UpdateArg }): Promise<UpdateResult> {
  const controller = new AbortController();

  const res = await fetch(`${url}/${arg.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: arg.status }),
    signal: controller.signal,
  });

  if (!res.ok) {
    let errMsg = res.statusText;
    try {
      const json = await res.json();
      errMsg = json.details || json.error || errMsg;
    } catch {
      /* ignore */
    }
    throw new Error(`상태 업데이트에 실패했습니다. (${res.status}): ${errMsg}`);
  }

  // 204 대응
  if (res.status === 204) return null;
  return res.json();
}

export function useUpdateApplicationStatus() {
  const { mutate } = useSWRConfig();
  return useSWRMutation<UpdateResult, Error, string, UpdateArg>(appKeys.all, patchStatus, {
    onSuccess: async () => {
      await Promise.all([
        mutate((key) => typeof key === 'string' && key.startsWith('/api/tournament-applications')),
      ]);
    },
    // 필요 시: rollbackOnError: true, revalidate: false 등 옵션 조정 가능
  });
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
