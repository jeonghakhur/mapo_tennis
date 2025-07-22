import useSWR from 'swr';
import type { Post, PostInput } from '@/model/post';

export function usePosts(showAll = false) {
  const { data, error, isLoading, mutate } = useSWR(`/api/posts?all=${showAll}`, null);

  // 생성
  const createPost = async (newPost: PostInput) => {
    const previous: Post[] = data?.posts || [];
    mutate([newPost, ...previous], false); // Optimistic
    try {
      await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPost),
      });
      mutate(); // 서버 동기화
    } catch (e) {
      mutate(previous, false); // 롤백
      throw e;
    }
  };

  // 수정
  const updatePost = async (id: string, updatedFields: Partial<PostInput>) => {
    const previous: Post[] = data?.posts || [];
    mutate(
      previous.map((p: Post) => (p._id === id ? { ...p, ...updatedFields } : p)),
      false,
    );
    try {
      await fetch(`/api/posts?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields),
      });
      mutate();
    } catch (e) {
      mutate(previous, false);
      throw e;
    }
  };

  // 삭제
  const deletePost = async (id: string) => {
    const previous: Post[] = data?.posts || [];
    mutate(
      previous.filter((p: Post) => p._id !== id),
      false,
    );
    try {
      await fetch(`/api/posts?id=${id}`, { method: 'DELETE' });
      mutate();
    } catch (e) {
      mutate(previous, false);
      throw e;
    }
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
