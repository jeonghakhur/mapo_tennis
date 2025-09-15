import useSWR, { mutate as globalMutate } from 'swr';
import { useState, useCallback, useMemo } from 'react';
import type { Post, PostInput } from '@/model/post';

interface UsePostsOptions {
  showAll?: boolean;
  pageSize?: number;
}

export function usePosts(options: UsePostsOptions = {}) {
  const { showAll = true, pageSize = 10 } = options;
  const [currentPage, setCurrentPage] = useState(1);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const params = new URLSearchParams({
    all: showAll.toString(),
    page: currentPage.toString(),
    limit: pageSize.toString(),
  });

  const { data, error, mutate } = useSWR(`/api/posts?${params.toString()}`, null, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  // 새로운 데이터가 로드되면 allPosts에 추가
  useMemo(() => {
    if (data?.posts) {
      if (currentPage === 1) {
        // 첫 페이지인 경우 교체
        setAllPosts(data.posts);
        setIsInitialLoading(false);
      } else {
        // 추가 페이지인 경우 기존 데이터에 추가 (중복 제거)
        setAllPosts((prev) => {
          const existingIds = new Set(prev.map((post) => post._id));
          const newPosts = data.posts.filter((post: Post) => !existingIds.has(post._id));
          return [...prev, ...newPosts];
        });
      }
      // 페이지 크기와 같으면 더 있을 가능성이 있음, 작으면 마지막 페이지
      setHasMore(data.posts.length >= pageSize);
      setIsLoadingMore(false);
    }
  }, [data, currentPage, pageSize]);

  // 다음 페이지 로드
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      setCurrentPage((prev) => prev + 1);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore]);

  // 생성
  const createPost = async (newPost: PostInput) => {
    const previous: Post[] = data?.posts || [];
    await mutate(
      async () => {
        await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newPost),
        });
        // 서버 동기화
        return undefined;
      },
      {
        optimisticData: { posts: [newPost, ...previous] },
        rollbackOnError: true,
        revalidate: true,
        populateCache: true,
      },
    );
  };

  // 수정 - 캐시 무효화 최적화
  const updatePost = async (id: string, updatedFields: Partial<PostInput>) => {
    const previous: Post[] = data?.posts || [];
    await mutate(
      async () => {
        await fetch(`/api/posts?id=${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedFields),
        });
        return undefined;
      },
      {
        optimisticData: {
          posts: previous.map((p: Post) => (p._id === id ? { ...p, ...updatedFields } : p)),
        },
        rollbackOnError: true,
        revalidate: true,
        populateCache: true,
      },
    );

    // 필요한 캐시만 선택적으로 무효화
    const promises = [];
    promises.push(globalMutate(`/api/posts?id=${id}`));

    // 현재 페이지가 all=true인 경우에만 해당 캐시 무효화
    if (showAll) {
      promises.push(globalMutate(`/api/posts?all=true`));
    } else {
      promises.push(globalMutate(`/api/posts?all=false`));
    }

    // 병렬로 캐시 무효화 실행
    await Promise.all(promises);
  };

  // 삭제
  const deletePost = async (id: string) => {
    const previous: Post[] = data?.posts || [];
    await mutate(
      async () => {
        await fetch(`/api/posts?id=${id}`, { method: 'DELETE' });
        return undefined;
      },
      {
        optimisticData: {
          posts: previous.filter((p: Post) => p._id !== id),
        },
        rollbackOnError: true,
        revalidate: true,
        populateCache: true,
      },
    );
  };

  return {
    posts: allPosts,
    isLoading: isInitialLoading,
    error,
    mutate,
    createPost,
    updatePost,
    deletePost,
    loadMore,
    hasMore,
    isLoadingMore,
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
  );

  return {
    posts: Array.isArray(data) ? data : [],
    isLoading,
    error,
    mutate,
  };
}
