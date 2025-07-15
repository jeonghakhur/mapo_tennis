'use client';
import { Box, Text, Button, Flex, Badge } from '@radix-ui/themes';
import { useNotifications } from '@/hooks/useNotifications';
import Container from '@/components/Container';
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react';
import type { Notification, Change } from '@/model/notification';

export default function NotificationsPage() {
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return '방금 전';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}시간 전`;
    } else {
      return date.toLocaleDateString('ko-KR');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'CREATE':
        return <Badge color="green">생성</Badge>;
      case 'UPDATE':
        return <Badge color="blue">수정</Badge>;
      case 'DELETE':
        return <Badge color="red">삭제</Badge>;
      default:
        return <Badge>알림</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Container>
        <Box>
          <Text>알림을 불러오는 중...</Text>
        </Box>
      </Container>
    );
  }

  return (
    <Container>
      <Box>
        <Flex align="center" justify="between" mb="4">
          <Flex align="center" gap="2">
            <Bell size={24} />
            <Text size="6" weight="bold">
              알림
            </Text>
            {unreadCount > 0 && (
              <Badge color="red" size="2">
                {unreadCount}
              </Badge>
            )}
          </Flex>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} size="2" variant="soft">
              <CheckCheck size={16} />
              모두 읽음 처리
            </Button>
          )}
        </Flex>

        {notifications.length === 0 ? (
          <Box className="text-center py-8">
            <Bell size={48} className="mx-auto text-gray-400 mb-4" />
            <Text size="4" color="gray">
              새로운 알림이 없습니다.
            </Text>
          </Box>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification: Notification) => (
              <div
                key={notification._id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  notification.readAt
                    ? 'bg-gray-50 border-gray-200'
                    : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                }`}
                onClick={() => !notification.readAt && markAsRead(notification._id)}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getNotificationIcon(notification.type)}
                      <Text weight="bold" size="3">
                        {notification.title}
                      </Text>
                      {!notification.readAt && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                    </div>

                    <Text size="2" color="gray" className="block mb-2">
                      {notification.message}
                    </Text>

                    {notification.changes && notification.changes.length > 0 && (
                      <div className="mt-3 p-2 bg-gray-100 rounded text-sm">
                        <Text weight="bold" size="1" className="block mb-1">
                          변경사항:
                        </Text>
                        {notification.changes.map((change: Change, idx: number) => (
                          <div key={idx} className="text-xs">
                            <Text color="gray">{change.field}: </Text>
                            <Text color="red">{change.oldValue || '없음'} → </Text>
                            <Text color="green">{change.newValue}</Text>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <Text size="1" color="gray">
                        {formatDate(notification.createdAt)}
                      </Text>
                      {notification.readAt && <Check size={16} className="text-green-500" />}
                      <Button
                        size="1"
                        variant="soft"
                        color="red"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('이 알림을 삭제하시겠습니까?')) {
                            deleteNotification(notification._id);
                          }
                        }}
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Box>
    </Container>
  );
}
