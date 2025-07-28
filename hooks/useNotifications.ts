import useSWR, { mutate } from 'swr';
import { useSession } from 'next-auth/react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const DEFAULT_REFRESH_INTERVAL =
  typeof window !== 'undefined' && process.env.NEXT_PUBLIC_NOTI_REFRESH_INTERVAL
    ? Number(process.env.NEXT_PUBLIC_NOTI_REFRESH_INTERVAL)
    : 10000;

export function useNotifications(userId?: string, options?: { pause?: boolean }) {
  const { status } = useSession();
  const { pause } = options || {};
  const shouldFetch = status === 'authenticated' && !pause;

  const { data, error, isLoading } = useSWR(
    shouldFetch ? `/api/notifications${userId ? `?userId=${userId}` : ''}` : null,
    fetcher,
    {
      refreshInterval: shouldFetch ? DEFAULT_REFRESH_INTERVAL : 0,
      revalidateOnFocus: true,
    },
  );

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  // 개별 알림 읽음 처리
  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
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
  const deleteNotification = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
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
