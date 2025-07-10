import { useState, useCallback } from 'react';

/**
 * 범용 로딩 상태 관리 훅
 * - loading: boolean 상태
 * - setLoading: 수동 제어
 * - withLoading: 비동기 함수 실행 시 자동으로 로딩 관리
 */
export function useLoading() {
  const [loading, setLoading] = useState(false);

  // 비동기 함수 실행 시 자동으로 로딩 관리
  const withLoading = useCallback(async (fn: () => Promise<unknown>) => {
    setLoading(true);
    try {
      await fn();
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, setLoading, withLoading };
}
