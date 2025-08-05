import useSWR, { mutate } from 'swr';
import { useSession } from 'next-auth/react';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    // @ts-expect-error - Adding custom properties to Error object
    error.info = await res.json();
    // @ts-expect-error - Adding custom properties to Error object
    error.status = res.status;
    throw error;
  }
  return res.json();
};

export function useNotifications(
  userId?: string,
  userLevel?: number,
  options?: { pause?: boolean },
) {
  const { status } = useSession();
  const { pause } = options || {};
  const shouldFetch = status === 'authenticated' && !pause;

  const { data, error, isLoading } = useSWR(
    shouldFetch ? `/api/notifications${userId ? `?userId=${userId}` : ''}` : null,
    fetcher,
    {
      // 자동 새로고침 제거 - 페이지 이동/새로고침 시에만 알림 확인
      refreshInterval: 0,
      // 페이지 포커스 시 새로고침 (사용자가 다른 탭에서 돌아올 때)
      revalidateOnFocus: true,
      // 페이지가 다시 보일 때 새로고침 (모바일에서 앱으로 돌아올 때)
      revalidateOnReconnect: true,
    },
  );

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  // 개별 알림 읽음 처리
  const markAsRead = async (notificationStatusId: string) => {
    try {
      await fetch(`/api/notifications/${notificationStatusId}`, {
        method: 'PATCH',
      });

      // 로컬 상태 업데이트
      mutate(`/api/notifications${userId ? `?userId=${userId}` : ''}`);
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error);
    }
  };

  // 모든 알림 읽음 처리
  const markAllAsRead = async () => {
    try {
      await fetch(`/api/notifications/mark-all-read${userId ? `?userId=${userId}` : ''}`, {
        method: 'POST',
      });

      // 로컬 상태 업데이트
      mutate(`/api/notifications${userId ? `?userId=${userId}` : ''}`);
    } catch (error) {
      console.error('모든 알림 읽음 처리 실패:', error);
    }
  };

  // 알림 삭제
  const deleteNotification = async (notificationStatusId: string) => {
    try {
      await fetch(`/api/notifications/${notificationStatusId}`, {
        method: 'DELETE',
      });

      // 로컬 상태 업데이트
      mutate(`/api/notifications${userId ? `?userId=${userId}` : ''}`);
    } catch (error) {
      console.error('알림 삭제 실패:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}
