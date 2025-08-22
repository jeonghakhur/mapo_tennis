import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import { mutate } from 'swr';

interface GroupingItem {
  tournamentId: string;
  division: string;
  tournamentTitle: string;
  count: number;
  updatedAt: string;
}

interface GroupingsResponse {
  groupings: GroupingItem[];
}

// 조편성 목록 조회 훅
export function useTournamentGroupings() {
  const { data, error, isLoading, mutate } = useSWR<GroupingsResponse>(
    '/api/tournament-grouping/index',
    null,
    {
      revalidateOnFocus: false, // 포커스 시 재검증 비활성화
      revalidateOnReconnect: true, // 네트워크 재연결 시 재검증
      dedupingInterval: 5 * 60 * 1000, // 5분간 중복 요청 방지
    },
  );

  return {
    groupings: data?.groupings || [],
    isLoading,
    error,
    mutate,
  };
}

// 조편성 생성 후 캐시 무효화 훅
export function useInvalidateGroupings() {
  return useSWRMutation('/api/tournament-grouping/index', async () => {
    // 캐시만 무효화하고 실제 API 호출은 하지 않음
    await mutate('/api/tournament-grouping/index');
  });
}

// 조편성 삭제 후 캐시 무효화 훅
export function useDeleteGroupings() {
  return useSWRMutation(
    '/api/tournament-grouping/delete-all',
    async (url, { arg }: { arg: { tournamentId: string; division: string } }) => {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(arg),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '조편성 삭제에 실패했습니다.');
      }

      return response.json();
    },
    {
      onSuccess: () => {
        // 삭제 성공 시 캐시 무효화
        mutate('/api/tournament-grouping/index');
      },
    },
  );
}
