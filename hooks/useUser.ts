import useSWR from 'swr';
import type { User } from '@/model/user';

// 이메일로 사용자 정보 조회
export function useUser(email?: string) {
  const { data, error, isLoading, mutate } = useSWR<{ user: User | null }>(
    email ? `/api/user?email=${encodeURIComponent(email)}` : null,
    null,
  );

  return {
    user: data?.user || null,
    isLoading,
    error,
    mutate,
  };
}

// 사용자 ID로 사용자 정보 조회
export function useUserById(id?: string) {
  const { data, error, isLoading, mutate } = useSWR<{ user: User | null }>(
    id ? `/api/user?id=${encodeURIComponent(id)}` : null,
    null,
  );

  return {
    user: data?.user || null,
    isLoading,
    error,
    mutate,
  };
}
