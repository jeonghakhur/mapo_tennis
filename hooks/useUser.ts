import useSWR from 'swr';
import { useState } from 'react';
import { signOut } from 'next-auth/react';

/**
 * 유저 관련 SWR 및 회원가입 로직을 통합 관리하는 훅
 * @param email 이메일 주소
 * @returns { user, isLoading, error, mutate, signup, signupLoading, signupError }
 */
export function useUser(email?: string | null) {
  // SWR로 유저 정보 조회
  const { data, error, isLoading, mutate } = useSWR(email ? `/api/user/?email=${email}` : null);

  // 회원가입 상태 관리
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);

  async function signup(userData: {
    name: string;
    phone: string;
    gender: string;
    birth: string;
    score: string;
    email?: string | null;
    address?: string;
  }) {
    setSignupError(null);
    setSignupLoading(true);
    try {
      const res = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (res.ok) {
        await signOut({ callbackUrl: '/signup-success' });
      } else {
        setSignupError('회원가입에 실패했습니다. 다시 시도해 주세요.');
      }
    } catch {
      setSignupError('회원가입에 실패했습니다. 다시 시도해 주세요.');
    }
    setSignupLoading(false);
  }

  // 회원 정보 수정 상태 관리
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  async function updateUser(userData: {
    name: string;
    phone: string;
    gender: string;
    birth: string;
    score: string | number;
    email?: string | null;
    address?: string;
  }) {
    setUpdateError(null);
    setUpdateLoading(true);
    try {
      const res = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (!res.ok) {
        setUpdateError('회원 정보 수정에 실패했습니다. 다시 시도해 주세요.');
      } else {
        await mutate(); // 최신 정보로 갱신
      }
    } catch {
      setUpdateError('회원 정보 수정에 실패했습니다. 다시 시도해 주세요.');
    }
    setUpdateLoading(false);
  }

  return {
    user: data?.user,
    isLoading,
    error,
    mutate,
    signup,
    signupLoading,
    signupError,
    updateUser,
    updateLoading,
    updateError,
  };
}
