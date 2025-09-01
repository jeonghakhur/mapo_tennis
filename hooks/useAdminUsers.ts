import useSWR from 'swr';
import type { User } from '@/model/user';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface UseAdminUsersParams {
  page: number;
  limit: number;
  search: string;
  sortBy: string;
  sortOrder: string;
}

export function useAdminUsers({ page, limit, search, sortBy, sortOrder }: UseAdminUsersParams) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    search: search.trim(), // 공백 제거
    sortBy,
    sortOrder,
  });

  // 검색어가 있을 때만 캐시 키에 포함
  const cacheKey = search.trim()
    ? `/api/users?${params.toString()}`
    : `/api/users?${new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
      }).toString()}`;

  const { data, error, isLoading, mutate } = useSWR(cacheKey, async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error('회원 목록을 불러올 수 없습니다.');
    return res.json();
  });

  return {
    users: (data?.users as User[]) || [],
    pagination: (data?.pagination as PaginationInfo) || { page, limit, total: 0, totalPages: 0 },
    isLoading,
    error,
    mutate,
  };
}
