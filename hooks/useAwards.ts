import useSWR from 'swr';
import type { Award, AwardInput } from '@/model/award';

// 수상 결과 데이터 타입 정의
export type AwardsData = Award[];

// 이메일로 수상 결과 목록 조회
export function useAwards() {
  const { data, error, isLoading, mutate } = useSWR<AwardsData>('/api/awards', null);

  // 생성
  const createAward = async (newAward: AwardInput) => {
    const previous: Award[] = data || [];

    await mutate(
      async () => {
        const response = await fetch('/api/awards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newAward),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '등록에 실패했습니다.');
        }

        const result = await response.json();
        return [result, ...previous];
      },
      {
        optimisticData: [newAward as Award, ...previous],
        rollbackOnError: true,
        revalidate: false,
      },
    );
  };

  // 수정
  const updateAward = async (id: string, updatedFields: AwardInput) => {
    const previous: Award[] = data || [];

    await mutate(
      async () => {
        const response = await fetch(`/api/awards/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedFields),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '수정에 실패했습니다.');
        }

        const result = await response.json();
        return previous.map((award: Award) => (award._id === id ? { ...award, ...result } : award));
      },
      {
        optimisticData: previous.map((award: Award) =>
          award._id === id ? { ...award, ...updatedFields } : award,
        ),
        rollbackOnError: true,
        revalidate: false,
      },
    );
  };

  // 삭제
  const deleteAward = async (id: string) => {
    const previous: Award[] = data || [];

    await mutate(
      async () => {
        const response = await fetch(`/api/awards/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '삭제에 실패했습니다.');
        }

        return previous.filter((award: Award) => award._id !== id);
      },
      {
        optimisticData: previous.filter((award: Award) => award._id !== id),
        rollbackOnError: true,
        revalidate: false,
      },
    );
  };

  // 전체 삭제
  const deleteAllAwards = async () => {
    await mutate(
      async () => {
        const response = await fetch('/api/awards/delete-all', {
          method: 'DELETE',
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '전체 삭제에 실패했습니다.');
        }
        return [];
      },
      {
        optimisticData: [],
        rollbackOnError: true,
        revalidate: false,
      },
    );
  };

  // 개별 award 찾기
  const getAwardById = (id: string): Award | null => {
    if (!data || !id) return null;
    return data.find((award) => award._id === id) || null;
  };

  return {
    awards: data || [],
    isLoading,
    error,
    mutate,
    createAward,
    updateAward,
    deleteAward,
    deleteAllAwards, // 추가
    getAwardById,
  };
}

// 개별 수상 결과 조회 (별도 API 호출)
export function useAward(id: string) {
  const { data, error, isLoading, mutate } = useSWR<Award>(id ? `/api/awards/${id}` : null, null);

  return {
    award: data || null,
    isLoading,
    error,
    mutate,
  };
}
