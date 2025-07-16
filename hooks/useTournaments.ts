import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import { mutate } from 'swr';
import type { Tournament, TournamentFormData } from '@/model/tournament';

// 대회 목록을 시작일 기준으로 정렬하는 공통 함수
function sortTournamentsByStartDate(tournaments: Tournament[]): Tournament[] {
  return tournaments.sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
  );
}

// 대회 목록 캐시를 정렬된 상태로 갱신하는 공통 함수
function updateTournamentsCache(tournaments: Tournament[]): Tournament[] {
  return sortTournamentsByStartDate(tournaments);
}

export function useTournaments() {
  const { data, error, isLoading, mutate } = useSWR<Tournament[]>('/api/tournaments', null, {
    refreshInterval: 10000, // 10초마다 새로고침
  });

  return {
    tournaments: data || [],
    isLoading,
    error,
    mutate,
  };
}

export function useTournament(id: string) {
  const { data, error, isLoading, mutate } = useSWR<Tournament>(
    id ? `/api/tournaments/${id}` : null,
    null,
  );

  return {
    tournament: data || null,
    isLoading,
    error,
    mutate,
  };
}

export function useCreateTournament() {
  return useSWRMutation(
    '/api/tournaments',
    async (url, { arg }: { arg: TournamentFormData }) => {
      const formDataToSend = new FormData();
      Object.entries(arg).forEach(([key, value]) => {
        if (value !== undefined) {
          formDataToSend.append(key, value as string);
        }
      });
      const response = await fetch(url, {
        method: 'POST',
        body: formDataToSend,
      });
      if (!response.ok) throw new Error('대회 등록 실패');
      return response.json() as Promise<Tournament>;
    },
    {
      onSuccess: (newTournament) => {
        mutate(
          '/api/tournaments',
          (current: Tournament[] = []) => {
            // 새로운 대회를 시작일 기준으로 정렬된 적절한 위치에 삽입
            return updateTournamentsCache([...current, newTournament]);
          },
          false,
        );
      },
    },
  );
}

// 대회 수정(업데이트)용 훅
export function useUpdateTournament(id: string) {
  return useSWRMutation(
    id ? `/api/tournaments/${id}` : null,
    async (url, { arg }: { arg: TournamentFormData & { status?: string } }) => {
      const formDataToSend = new FormData();
      Object.entries(arg).forEach(([key, value]) => {
        if (value !== undefined) {
          formDataToSend.append(key, value as string);
        }
      });
      const response = await fetch(url, {
        method: 'PUT',
        body: formDataToSend,
      });
      if (!response.ok) throw new Error('대회 수정 실패');
      return response.json() as Promise<Tournament>;
    },
    {
      onSuccess: (updatedTournament) => {
        // 목록 캐시 업데이트
        mutate(
          '/api/tournaments',
          (current: Tournament[] = []) => {
            // 수정된 대회를 시작일 기준으로 정렬된 적절한 위치에 삽입
            const existingTournament = current.find((t) => t._id === id);
            if (existingTournament) {
              const filteredTournaments = current.filter((t) => t._id !== id);
              return updateTournamentsCache([...filteredTournaments, updatedTournament]);
            }
            return current;
          },
          false,
        );

        // 상세 페이지 캐시 업데이트
        mutate(`/api/tournaments/${id}`, updatedTournament, false);
      },
    },
  );
}

// 대회 삭제용 훅
export function useDeleteTournament(id: string) {
  return useSWRMutation(
    id ? `/api/tournaments/${id}` : null,
    async (url) => {
      const response = await fetch(url, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('대회 삭제 실패');
      return response.json();
    },
    {
      onSuccess: () => {
        // 목록에서 삭제된 대회 제거하고 정렬된 상태로 반환
        mutate(
          '/api/tournaments',
          (current: Tournament[] = []) => {
            const filteredTournaments = current.filter((t) => t._id !== id);
            return updateTournamentsCache(filteredTournaments);
          },
          false,
        );
        // 상세 페이지 캐시 무효화
        mutate(`/api/tournaments/${id}`, null, false);
      },
    },
  );
}
