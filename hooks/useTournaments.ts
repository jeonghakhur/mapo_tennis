import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import { mutate } from 'swr';
import type { Tournament, TournamentFormData } from '@/model/tournament';

// FormData 생성을 위한 공통 함수
function createTournamentFormData(data: TournamentFormData): FormData {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      if (key === 'divisions' && Array.isArray(value)) {
        // divisions는 JSON 문자열로 변환
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value as string);
      }
    }
  });
  return formData;
}

// HTTP 메서드 타입
type HttpMethod = 'POST' | 'PUT' | 'DELETE';

// 공통 HTTP 요청 함수
async function fetchTournamentAPI(
  url: string,
  method: HttpMethod,
  body?: FormData,
): Promise<Tournament> {
  const response = await fetch(url, {
    method,
    body,
  });

  if (!response.ok) {
    const errorMessages: Record<HttpMethod, string> = {
      POST: '대회 등록 실패',
      PUT: '대회 수정 실패',
      DELETE: '대회 삭제 실패',
    };
    throw new Error(errorMessages[method]);
  }

  return response.json() as Promise<Tournament>;
}

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

// 캐시 업데이트 헬퍼 함수들
function updateTournamentsListCache(newTournament: Tournament) {
  mutate(
    '/api/tournaments',
    (current: Tournament[] = []) => {
      return updateTournamentsCache([...current, newTournament]);
    },
    false,
  );
}

function updateTournamentInCache(id: string, updatedTournament: Tournament) {
  // 목록 캐시 업데이트
  mutate(
    '/api/tournaments',
    (current: Tournament[] = []) => {
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
}

function removeTournamentFromCache(id: string) {
  // 목록에서 삭제된 대회 제거
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
}

// 사용자 권한에 따라 다른 대회 목록을 가져오는 훅
export function useTournamentsByUserLevel(userLevel?: number) {
  const { data, error, isLoading, mutate } = useSWR<Tournament[]>(
    // userLevel이 undefined여도 기본 대회 목록을 가져올 수 있도록 수정
    `/api/tournaments?userLevel=${userLevel ?? 0}`,
    null,
  );

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
      const formDataToSend = createTournamentFormData(arg);
      return fetchTournamentAPI(url, 'POST', formDataToSend);
    },
    {
      onSuccess: (newTournament) => {
        updateTournamentsListCache(newTournament);
      },
    },
  );
}

// 대회 수정(업데이트)용 훅
export function useUpdateTournament(id: string) {
  return useSWRMutation(
    id ? `/api/tournaments/${id}` : null,
    async (url, { arg }: { arg: TournamentFormData & { status?: string } }) => {
      const formDataToSend = createTournamentFormData(arg);
      return fetchTournamentAPI(url, 'PUT', formDataToSend);
    },
    {
      onSuccess: (updatedTournament) => {
        updateTournamentInCache(id, updatedTournament);
      },
    },
  );
}

// 대회 삭제용 훅
export function useDeleteTournament(id: string) {
  return useSWRMutation(
    id ? `/api/tournaments/${id}` : null,
    async (url) => {
      return fetchTournamentAPI(url, 'DELETE');
    },
    {
      onSuccess: () => {
        removeTournamentFromCache(id);
      },
    },
  );
}
