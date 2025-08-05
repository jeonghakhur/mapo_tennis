import { client } from '@/sanity/lib/client';
import type { Notification, NotificationInput } from '@/model/notification';

// 알림 생성
export async function createNotification(data: NotificationInput): Promise<Notification> {
  // changes 배열에 _key 추가
  const notificationData = {
    ...data,
    changes: data.changes?.map((change, index) => ({
      _key: `change_${Date.now()}_${index}`,
      ...change,
    })),
    createdAt: new Date().toISOString(),
  };

  const notification = await client.create({
    _type: 'notification',
    ...notificationData,
  });

  return notification as Notification;
}

// 알림 목록 조회 (새로운 notificationStatus 구조 사용)
export async function getNotifications(userId?: string): Promise<Notification[]> {
  if (!userId) {
    return [];
  }

  // notificationStatus를 통해 사용자별 알림 상태 조회
  const query = `
    *[_type == "notificationStatus" && user._ref == $userId && !isDeleted] {
      _id,
      isRead,
      readAt,
      createdAt,
      notification->{
        _id,
        type,
        entityType,
        entityId,
        title,
        message,
        link,
        changes,
        targetUsers,
        requiredLevel,
        createdAt
      }
    } | order(notification.createdAt desc)
  `;

  const notificationStatuses = await client.fetch(query, { userId });

  console.log('알림 조회 - userId:', userId);
  console.log('알림 조회 - notificationStatuses 개수:', notificationStatuses.length);

  // notification 필드가 있는 항목만 필터링하고 알림 데이터 추출
  const notifications = notificationStatuses
    .filter((status: { notification: Notification | null }) => status.notification)
    .map(
      (status: {
        _id: string;
        isRead: boolean;
        readAt: string | null;
        createdAt: string;
        notification: Notification;
      }) => ({
        ...status.notification,
        _id: status._id, // notificationStatus의 ID를 사용 (삭제/읽음 처리용)
        readAt: status.isRead ? status.readAt : null,
        createdAt: status.notification.createdAt, // 실제 알림 생성 시간 사용
      }),
    );

  console.log('알림 조회 - 최종 notifications 개수:', notifications.length);
  return notifications;
}

// 읽지 않은 알림 개수 조회 (새로운 notificationStatus 구조 사용)
export async function getUnreadNotificationCount(userId?: string): Promise<number> {
  if (!userId) {
    return 0;
  }

  // 읽지 않은 알림 개수 조회
  const query = `
    count(*[_type == "notificationStatus" && user._ref == $userId && !isRead && !isDeleted])
  `;

  const unreadCount = await client.fetch(query, { userId });
  return unreadCount;
}

// 알림 읽음 처리 (새로운 notificationStatus 구조 사용)
export async function markNotificationAsRead(notificationStatusId: string): Promise<void> {
  await client
    .patch(notificationStatusId)
    .set({
      isRead: true,
      readAt: new Date().toISOString(),
    })
    .commit();
}

// 모든 알림 읽음 처리 (새로운 notificationStatus 구조 사용)
export async function markAllNotificationsAsRead(userId?: string): Promise<void> {
  if (!userId) {
    return;
  }

  const query = `
    *[_type == "notificationStatus" && user._ref == $userId && !isRead && !isDeleted]
  `;

  const notificationStatuses = await client.fetch(query, { userId });

  const patches = notificationStatuses.map((status: { _id: string }) =>
    client.patch(status._id).set({
      isRead: true,
      readAt: new Date().toISOString(),
    }),
  );

  await Promise.all(patches.map((patch: { commit: () => Promise<void> }) => patch.commit()));
}

// 알림 삭제 (새로운 notificationStatus 구조 사용)
export async function deleteNotification(notificationStatusId: string): Promise<void> {
  await client
    .patch(notificationStatusId)
    .set({
      isDeleted: true,
      deletedAt: new Date().toISOString(),
    })
    .commit();
}

// 모든 알림 삭제 (관리자용)
export async function deleteAllNotifications(): Promise<{ deletedCount: number }> {
  // 모든 notificationStatus 삭제 처리
  const query = `*[_type == "notificationStatus"]`;
  const notificationStatuses = await client.fetch(query);

  if (notificationStatuses.length === 0) {
    return { deletedCount: 0 };
  }

  const patches = notificationStatuses.map((status: { _id: string }) =>
    client.patch(status._id).set({
      isDeleted: true,
      deletedAt: new Date().toISOString(),
    }),
  );

  await Promise.all(patches.map((patch: { commit: () => Promise<void> }) => patch.commit()));

  return { deletedCount: notificationStatuses.length };
}

// 모든 알림 완전 삭제 (관리자용)
export async function permanentlyDeleteAllNotifications(): Promise<{ deletedCount: number }> {
  // 1. 모든 notification 조회
  const notificationsQuery = `*[_type == "notification"]`;
  const notifications = await client.fetch(notificationsQuery);

  if (notifications.length === 0) {
    return { deletedCount: 0 };
  }

  // 2. 모든 notificationStatus 삭제
  const notificationStatusesQuery = `*[_type == "notificationStatus"]`;
  const notificationStatuses = await client.fetch(notificationStatusesQuery);

  if (notificationStatuses.length > 0) {
    const statusDeletions = notificationStatuses.map((status: { _id: string }) =>
      client.delete(status._id),
    );
    await Promise.all(statusDeletions);
  }

  // 3. 모든 notification 삭제
  const notificationDeletions = notifications.map((notification: { _id: string }) =>
    client.delete(notification._id),
  );
  await Promise.all(notificationDeletions);

  return { deletedCount: notifications.length };
}

// 사용자별 알림 상태 생성 (새로운 알림이 생성될 때 호출)
export async function createNotificationStatuses(
  notificationId: string,
  targetUserIds?: string[],
  requiredLevel?: number,
): Promise<void> {
  // 대상 사용자들이 지정된 경우
  if (targetUserIds && targetUserIds.length > 0) {
    const statuses = targetUserIds.map((userId) => ({
      _type: 'notificationStatus',
      user: { _type: 'reference', _ref: userId },
      notification: { _type: 'reference', _ref: notificationId },
      isRead: false,
      isDeleted: false,
      createdAt: new Date().toISOString(),
    }));

    await Promise.all(statuses.map((status) => client.create(status)));
  } else {
    // 레벨별 알림인 경우, 해당 레벨 이상의 모든 사용자에게 생성
    const usersQuery = `
      *[_type == "user" && level >= $requiredLevel] {
        _id
      }
    `;

    const users = await client.fetch(usersQuery, { requiredLevel });

    const statuses = users.map((user: { _id: string }) => ({
      _type: 'notificationStatus',
      user: { _type: 'reference', _ref: user._id },
      notification: { _type: 'reference', _ref: notificationId },
      isRead: false,
      isDeleted: false,
      createdAt: new Date().toISOString(),
    }));

    await Promise.all(
      statuses.map(
        (status: {
          _type: string;
          user: { _type: string; _ref: string };
          notification: { _type: string; _ref: string };
          isRead: boolean;
          isDeleted: boolean;
          createdAt: string;
        }) => client.create(status),
      ),
    );
  }
}

// 변경사항 추적 함수
export function trackChanges(
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>,
): { field: string; oldValue: string | null; newValue: string | null }[] {
  const changes = [];

  // 제외할 시스템 필드들
  const excludeFields = [
    '_id',
    '_type',
    '_rev',
    '_createdAt',
    '_updatedAt',
    'createdAt',
    'updatedAt',
    'id',
    'rev',
    'leftAt', // 탈퇴 날짜 필드 제외
  ];

  // 필드명을 한글로 변환하는 맵
  const fieldNameMap: Record<string, string> = {
    user: '이름',
    birth: '출생년도',
    score: '점수',
    gender: '성별',
    status: '회원상태',
    role: '직위',
    tennisStartYear: '입문년도',
    // 참가신청 관련 필드
    division: '참가부서',
    tournamentType: '대회유형',
    contact: '연락처',
    email: '이메일',
    memo: '메모',
    isFeePaid: '참가비납부',
    teamMembers: '참가자목록',
    // 지출내역 관련 필드
    title: '제목',
    amount: '금액',
    category: '카테고리',
    date: '날짜',
    description: '설명',
  };

  // club 객체의 이름을 추출하는 함수
  const getClubName = (obj: unknown): string | null => {
    if (!obj || typeof obj !== 'object') return null;

    // 확장된 객체 형태: { _id: '...', name: '...' }
    if ('name' in obj) {
      return (obj as Record<string, unknown>).name?.toString() || null;
    }

    // 참조 형태: { _ref: '...', _type: 'reference' }
    if ('_ref' in obj) {
      // 참조의 경우 ID만 있으므로 null 반환 (실제 이름은 알 수 없음)
      return null;
    }

    return null;
  };

  // 값이 실제로 변경되었는지 확인하는 함수
  const hasSignificantChange = (oldValue: unknown, newValue: unknown): boolean => {
    const oldStr = oldValue?.toString();
    const newStr = newValue?.toString();

    // 빈 값이나 '없음' 값은 null로 처리
    const cleanOldValue =
      !oldStr || oldStr === '없음' || oldStr === 'null' || oldStr === 'undefined' ? null : oldStr;
    const cleanNewValue =
      !newStr || newStr === '없음' || newStr === 'null' || newStr === 'undefined' ? null : newStr;

    return cleanOldValue !== cleanNewValue;
  };

  for (const key in newData) {
    // 시스템 필드 제외
    if (excludeFields.includes(key)) {
      continue;
    }

    const oldValue = oldData[key];
    const newValue = newData[key];

    // 객체 타입 필드 처리 (club 등)
    if (typeof newValue === 'object' && newValue !== null) {
      if (key === 'club') {
        const oldClubName = getClubName(oldValue);
        const newClubName = getClubName(newValue);

        // 클럽명이 실제로 변경되었을 때만 추가
        if (hasSignificantChange(oldClubName, newClubName)) {
          changes.push({
            field: '클럽',
            oldValue: oldClubName,
            newValue: newClubName,
          });
        }
      } else {
        // 다른 객체 필드의 경우 JSON 비교
        const oldObjStr = oldValue ? JSON.stringify(oldValue) : null;
        const newObjStr = newValue ? JSON.stringify(newValue) : null;

        if (hasSignificantChange(oldObjStr, newObjStr)) {
          changes.push({
            field: fieldNameMap[key] || key,
            oldValue: oldObjStr,
            newValue: newObjStr,
          });
        }
      }
    } else {
      // 일반 필드 처리 - 실제로 변경된 경우만 추가
      if (hasSignificantChange(oldValue, newValue)) {
        const fieldName = fieldNameMap[key] || key;

        const oldStr = oldValue?.toString();
        const newStr = newValue?.toString();

        // 빈 값이나 '없음' 값은 null로 처리
        const cleanOldValue =
          !oldStr || oldStr === '없음' || oldStr === 'null' || oldStr === 'undefined'
            ? null
            : oldStr;
        const cleanNewValue =
          !newStr || newStr === '없음' || newStr === 'null' || newStr === 'undefined'
            ? null
            : newStr;

        changes.push({
          field: fieldName,
          oldValue: cleanOldValue,
          newValue: cleanNewValue,
        });
      }
    }
  }

  return changes;
}

// 알림 메시지 생성 헬퍼 함수
export function createNotificationMessage(
  type: 'CREATE' | 'UPDATE' | 'DELETE',
  entityType: string,
  entityName: string,
): { title: string; message: string } {
  if (entityType === 'QUESTION' && type === 'UPDATE') {
    return {
      title: '문의 답변 등록',
      message: `"${entityName}"에 대한 답변이 등록되었습니다.`,
    };
  }
  const entityTypeMap = {
    CLUB_MEMBER: '회원',
    CLUB: '클럽',
    POST: '게시글',
    TOURNAMENT_APPLICATION: '참가신청',
    USER: '사용자',
    EXPENSE: '지출내역',
    TOURNAMENT: '토너먼트',
    QUESTION: '문의',
  };

  const typeMap = {
    CREATE: '등록',
    UPDATE: '수정',
    DELETE: '삭제',
  };

  const title = `${entityTypeMap[entityType as keyof typeof entityTypeMap]} ${typeMap[type]}`;
  const message = `${entityName}이(가) ${typeMap[type]}되었습니다.`;
  return { title, message };
}

// 참가신청 상태 변경 알림 메시지 생성
export function createTournamentApplicationStatusMessage(
  oldStatus: string,
  newStatus: string,
  tournamentTitle: string,
  division: string,
): { title: string; message: string } {
  const statusMap = {
    pending: '대기중',
    approved: '승인',
    rejected: '거절',
    cancelled: '취소',
  };

  const oldStatusText = statusMap[oldStatus as keyof typeof statusMap] || oldStatus;
  const newStatusText = statusMap[newStatus as keyof typeof statusMap] || newStatus;

  const title = `참가신청 상태 변경`;
  const message = `${tournamentTitle} ${division}부 참가신청이 ${oldStatusText}에서 ${newStatusText}로 변경되었습니다.`;

  return { title, message };
}
