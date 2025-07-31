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

// 알림 목록 조회 (사용자 레벨에 따른 필터링)
export async function getNotifications(
  userId?: string,
  userLevel?: number,
  userCreatedAt?: string,
): Promise<Notification[]> {
  // 개인 알림과 레벨별 알림을 분리해서 조회
  const personalQuery = `*[_type == "notification" && userId == $userId]`;

  // 사용자 가입 시점 이후의 레벨별 알림만 조회 (또는 최근 7일)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoISO = sevenDaysAgo.toISOString();

  const levelQuery = userCreatedAt
    ? `*[_type == "notification" && requiredLevel <= $userLevel && !defined(userId) && createdAt >= $userCreatedAt]`
    : `*[_type == "notification" && requiredLevel <= $userLevel && !defined(userId) && createdAt >= $sevenDaysAgoISO]`;

  const params = { userId, userLevel, userCreatedAt, sevenDaysAgoISO };

  // 개인 알림과 레벨별 알림을 각각 조회
  const [personalNotifications, levelNotifications] = await Promise.all([
    userId ? client.fetch(personalQuery, params) : Promise.resolve([]),
    userLevel !== undefined ? client.fetch(levelQuery, params) : Promise.resolve([]),
  ]);

  // 중복 제거 (ID 기준)
  const allNotifications = [...personalNotifications, ...levelNotifications];
  const uniqueNotifications = allNotifications.filter(
    (notification, index, self) => index === self.findIndex((n) => n._id === notification._id),
  );

  // 생성일 기준으로 정렬
  const sortedNotifications = uniqueNotifications.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return sortedNotifications;
}

// 읽지 않은 알림 개수 조회 (사용자 레벨에 따른 필터링)
export async function getUnreadNotificationCount(
  userId?: string,
  userLevel?: number,
  userCreatedAt?: string,
): Promise<number> {
  // 중복 제거를 위해 전체 알림을 조회하고 개수 계산
  const allNotifications = await getNotifications(userId, userLevel, userCreatedAt);
  const unreadNotifications = allNotifications.filter((notification) => !notification.readAt);

  return unreadNotifications.length;
}

// 알림 읽음 처리
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await client.patch(notificationId).set({ readAt: new Date().toISOString() }).commit();
}

// 모든 알림 읽음 처리
export async function markAllNotificationsAsRead(userId?: string): Promise<void> {
  const query = `
    *[_type == "notification" && !defined(readAt) ${userId ? `&& userId == $userId` : ''}]
  `;

  const params = userId ? { userId } : {};
  const notifications = await client.fetch(query, params);

  const patches = notifications.map((notification: Notification) =>
    client.patch(notification._id).set({ readAt: new Date().toISOString() }),
  );

  await Promise.all(patches.map((patch: { commit: () => Promise<void> }) => patch.commit()));
}

// 알림 삭제
export async function deleteNotification(notificationId: string): Promise<void> {
  await client.delete(notificationId);
}

// 모든 알림 삭제 (관리자용)
export async function deleteAllNotifications(): Promise<{ deletedCount: number }> {
  const query = `*[_type == "notification"]`;
  const notifications = await client.fetch(query);

  if (notifications.length === 0) {
    return { deletedCount: 0 };
  }

  const patches = notifications.map((notification: Notification) =>
    client.delete(notification._id),
  );

  await Promise.all(patches);

  return { deletedCount: notifications.length };
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

  for (const key in newData) {
    // 시스템 필드 제외
    if (excludeFields.includes(key)) {
      continue;
    }

    // 객체 타입 필드 처리 (club 등)
    if (typeof newData[key] === 'object' && newData[key] !== null) {
      const oldObj = oldData[key];
      const newObj = newData[key];

      // club 객체의 경우 특별 처리
      if (key === 'club') {
        // 참조 형태와 확장된 객체 형태 모두 처리
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

        const oldClubName = getClubName(oldObj);
        const newClubName = getClubName(newObj);

        // 클럽명이 실제로 변경되었을 때만 추가
        if (oldClubName !== newClubName) {
          changes.push({
            field: '클럽',
            oldValue: oldClubName,
            newValue: newClubName,
          });
        }
      } else {
        // 다른 객체 필드의 경우 JSON 비교
        const oldObjStr = oldObj ? JSON.stringify(oldObj) : null;
        const newObjStr = newObj ? JSON.stringify(newObj) : null;

        if (oldObjStr !== newObjStr) {
          changes.push({
            field: key,
            oldValue: oldObjStr,
            newValue: newObjStr,
          });
        }
      }
    } else {
      // 일반 필드 처리
      if (oldData[key] !== newData[key]) {
        // 필드명을 한글로 변환
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
          //   leftAt: '탈퇴일', // 추가 (만약 표시하고 싶다면)
        };

        const fieldName = fieldNameMap[key] || key;

        const oldValue = oldData[key]?.toString();
        const newValue = newData[key]?.toString();

        // 빈 값이나 '없음' 값은 null로 처리
        const cleanOldValue =
          !oldValue || oldValue === '없음' || oldValue === 'null' || oldValue === 'undefined'
            ? null
            : oldValue;
        const cleanNewValue =
          !newValue || newValue === '없음' || newValue === 'null' || newValue === 'undefined'
            ? null
            : newValue;

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
