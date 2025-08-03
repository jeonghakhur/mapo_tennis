import useSWR from 'swr';
import type { User } from '@/model/user';

// 사용자 데이터 타입 정의
export type UserData = {
  name: string;
  email?: string;
  phone: string;
  gender: string;
  birth: string;
  score: number;
  address?: string;
  clubs: string[];
  isApprovedUser?: boolean;
  level?: number;
};

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

// 사용자 관리 훅 (회원가입, 수정 등)
export function useUserManagement() {
  const makeRequest = async (method: 'POST' | 'PUT', userData: UserData) => {
    const response = await fetch('/api/user', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage =
        method === 'POST' ? '회원가입에 실패했습니다.' : '회원 정보 수정에 실패했습니다.';
      throw new Error(errorData.error || errorMessage);
    }

    return response.json();
  };

  const signup = (userData: UserData) => makeRequest('POST', userData);
  const updateUser = (userData: UserData) => makeRequest('PUT', userData);

  return { signup, updateUser };
}
