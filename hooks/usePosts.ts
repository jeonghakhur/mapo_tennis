import useSWR from 'swr';
import type { Post, PostInput } from '@/model/post';

export function usePosts(showAll = true) {
  const { data, error, isLoading, mutate } = useSWR(`/api/posts?all=${showAll}`, null);

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

  // 수정
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
    posts: data?.posts || [],
    isLoading,
    error,
    mutate,
    createPost,
    updatePost,
    deletePost,
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

// 게시글 상태 변경(발행/임시저장) - 상세 단일 post용
export function usePostWithStatus(id: string) {
  const { data, error, isLoading, mutate } = useSWR(id ? `/api/posts?id=${id}` : null, null);

  // 게시글 상태 변경 (발행/임시저장)
  const updatePostStatus = async (isPublished: boolean) => {
    if (!data?.post) return;
    await mutate(
      async () => {
        const action = isPublished ? 'publish' : 'unpublish';
        const response = await fetch(`/api/posts?id=${id}&action=${action}`, {
          method: 'PATCH',
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || '상태 변경 실패');
        }
        return { post: { ...data.post, isPublished } };
      },
      {
        optimisticData: { post: { ...data.post, isPublished } },
        rollbackOnError: true,
        revalidate: true,
      },
    );
  };

  // 삭제
  const deletePost = async () => {
    if (!data?.post) return;
    await mutate(
      async () => {
        await fetch(`/api/posts?id=${id}`, { method: 'DELETE' });
        return { post: null };
      },
      {
        optimisticData: { post: null },
        rollbackOnError: true,
        revalidate: true,
      },
    );
  };

  return {
    post: data?.post || null,
    isLoading,
    error,
    mutate,
    updatePostStatus,
    deletePost,
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
