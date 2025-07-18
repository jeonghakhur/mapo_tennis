import useSWR from 'swr';
import { mutate as globalMutate } from 'swr';
import type { Club } from '@/model/club';

// 클럽 목록 조회 훅
export function useClubs() {
  const { data, error, isLoading, mutate } = useSWR<Club[]>('/api/clubs');

  return {
    clubs: data || [],
    isLoading,
    error,
    mutate,
  };
}

// 클럽 생성 API 요청 함수
export async function createClubRequest(clubData: Omit<Club, '_id' | '_type'>, imageFile?: File) {
  const formData = new FormData();
  Object.entries(clubData).forEach(([key, value]) => {
    if (value !== undefined && typeof value !== 'object') formData.append(key, value as string);
  });
  if (imageFile) {
    formData.append('image', imageFile);
  }
  const res = await fetch('/api/club', { method: 'POST', body: formData });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || '클럽 생성 실패');
  return data;
}

// optimisticData를 활용한 클럽 생성 함수
export async function createClubWithOptimistic(
  newClub: Club,
  clubData: Omit<Club, '_id' | '_type'>,
  imageFile?: File,
) {
  await globalMutate(
    '/api/club',
    async (currentData: { clubs: Club[] } = { clubs: [] }) => {
      const data = await createClubRequest(clubData, imageFile);
      console.log('createClubWithOptimistic:', data);
      return {
        clubs: [
          { ...newClub, _id: data.id },
          ...currentData.clubs.filter((c) => c._id !== newClub._id),
        ],
      };
    },
    {
      optimisticData: (currentData: { clubs: Club[] } = { clubs: [] }) => {
        const optimistic = { clubs: [newClub, ...currentData.clubs] };
        console.log('optimisticData:', newClub);
        return optimistic;
      },
      rollbackOnError: true,
      populateCache: true,
      revalidate: true,
    },
  );
}

// 클럽 단일 정보 조회 훅
export function useClub(id: string) {
  const { data, error, isLoading, mutate } = useSWR<{ club: Club }>(
    id ? `/api/club?id=${id}` : null,
  );
  // 클럽 삭제 함수
  async function deleteClubById() {
    await globalMutate(
      '/api/club',
      async (currentData: { clubs: Club[] } = { clubs: [] }) => {
        const res = await fetch(`/api/club?id=${id}`, { method: 'DELETE' });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || '삭제에 실패했습니다.');
        }
        return {
          clubs: currentData.clubs.filter((c) => c._id !== id),
        };
      },
      {
        optimisticData: (currentData: { clubs: Club[] } = { clubs: [] }) => ({
          clubs: currentData.clubs.filter((c) => c._id !== id),
        }),
        rollbackOnError: true,
        revalidate: true,
      },
    );
  }

  // 클럽 수정 함수
  async function updateClubById(
    updateData: Record<string, string | boolean | null | undefined>,
    imageFile?: File,
  ) {
    const formData = new FormData();
    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined && typeof value !== 'object') formData.append(key, value as string);
    });
    // 이미지 삭제 시 string 'null'로 명확히 전송
    if ('image' in updateData && updateData.image === null) {
      formData.append('image', 'null');
    }
    if (imageFile) {
      formData.append('image', imageFile);
    }
    const res = await fetch(`/api/club?id=${id}`, {
      method: 'PATCH',
      body: formData,
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || '수정에 실패했습니다.');
    }
    await globalMutate(`/api/club?id=${id}`);
  }

  return {
    club: data?.club,
    isLoading,
    error,
    deleteClubById,
    updateClubById,
    mutate,
  };
}
