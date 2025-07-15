import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function usePosts(showAll = false) {
  const { data, error, isLoading, mutate } = useSWR(`/api/posts?all=${showAll}`, fetcher, {
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
  const { data, error, isLoading, mutate } = useSWR(id ? `/api/posts?id=${id}` : null, fetcher);

  return {
    post: data?.post || null,
    isLoading,
    error,
    mutate,
  };
}
