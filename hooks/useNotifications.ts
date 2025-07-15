import useSWR, { mutate } from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useNotifications(userId?: string) {
  const { data, error, isLoading } = useSWR(
    `/api/notifications${userId ? `?userId=${userId}` : ''}`,
    fetcher,
    {
      refreshInterval: 10000, // 10초마다 폴링
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
