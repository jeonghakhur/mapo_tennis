import useSWR from 'swr';

export function usePosts(showAll = false) {
  const { data, error, isLoading, mutate } = useSWR(`/api/posts?all=${showAll}`, null, {
    refreshInterval: 10000, // 10초마다 새로고침
  });

  return {
    posts: data?.posts || [],
    isLoading,
    error,
    mutate,
  };
}

export function usePost(id: string) {
  const { data, error, isLoading, mutate } = useSWR(id ? `/api/posts?id=${id}` : null, null);

  return {
    post: data?.post || null,
    isLoading,
    error,
    mutate,
  };
}

export function usePostsByCategory(category: string) {
  const { data, error, isLoading, mutate } = useSWR(
    category ? `/api/posts?category=${category}` : null,
    null,
    {
      refreshInterval: 10000, // 10초마다 새로고침
    },
  );

  return {
    posts: Array.isArray(data) ? data : [],
    isLoading,
    error,
    mutate,
  };
}
