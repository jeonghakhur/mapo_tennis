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
  const docs = await client.fetch(`*[_type == "notificationStatus"]{_id}`);
  if (!docs.length) return { deletedCount: 0 };

  let i = 0;
  const BATCH = 300; // 필요 시 100~500 사이로 조정
  while (i < docs.length) {
    const tx = client.transaction();
    for (const d of docs.slice(i, i + BATCH)) {
      tx.patch(d._id, {
        set: { isDeleted: true, deletedAt: new Date().toISOString() },
      });
    }
    await tx.commit({ visibility: 'async' }); // 타임아웃 완화
    i += BATCH;
  }
  return { deletedCount: docs.length };
}

// 모든 알림 완전 삭제 (관리자용)
export async function permanentlyDeleteAllNotifications() {
  const ids1 = await client.fetch<string[]>('*[_type=="notificationStatus"][]._id');
  const ids2 = await client.fetch<string[]>('*[_type=="notification"][]._id');

  const BATCH = 300; // 100~500 권장
  for (let i = 0; i < ids1.length; i += BATCH) {
    const tx = client.transaction();
    ids1.slice(i, i + BATCH).forEach((id) => tx.delete(id));
    await tx.commit({ visibility: 'async' });
  }
  for (let i = 0; i < ids2.length; i += BATCH) {
    const tx = client.transaction();
    ids2.slice(i, i + BATCH).forEach((id) => tx.delete(id));
    await tx.commit({ visibility: 'async' });
  }
  return { deletedCount: ids2.length };
}

// 사용자별 알림 상태 생성 (새로운 알림이 생성될 때 호출)
export async function createNotificationStatuses(
  notificationId: string,
  targetUserIds?: string[],
  requiredLevel?: number,
): Promise<void> {
  // requiredLevel이 없으면 기본값 1로 설정 (모든 사용자)
  const level = requiredLevel ?? 1;

  // 1. 특정 사용자들에게 알림 생성 (targetUserIds가 있는 경우)
  if (targetUserIds && targetUserIds.length > 0) {
    const targetStatuses = targetUserIds.map((userId) => ({
      _type: 'notificationStatus',
      user: { _type: 'reference', _ref: userId },
      notification: { _type: 'reference', _ref: notificationId },
      isRead: false,
      isDeleted: false,
      createdAt: new Date().toISOString(),
    }));

    await Promise.all(targetStatuses.map((status) => client.create(status)));
  }

  // 2. 레벨별 알림 생성 (requiredLevel이 있는 경우)
  if (requiredLevel !== undefined) {
    const usersQuery = `
      *[_type == "user" && level >= $requiredLevel] {
        _id
      }
    `;

    const users = await client.fetch(usersQuery, { requiredLevel: level });

    // 중복 제거: targetUserIds에 이미 포함된 사용자는 제외
    const filteredUsers =
      targetUserIds && targetUserIds.length > 0
        ? users.filter((user: { _id: string }) => !targetUserIds.includes(user._id))
        : users;

    if (filteredUsers.length > 0) {
      const levelStatuses = filteredUsers.map((user: { _id: string }) => ({
        _type: 'notificationStatus',
        user: { _type: 'reference', _ref: user._id },
        notification: { _type: 'reference', _ref: notificationId },
        isRead: false,
        isDeleted: false,
        createdAt: new Date().toISOString(),
      }));

      await Promise.all(
        levelStatuses.map(
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
}

// 변경사항 추적 함수
// 상수 정의
const EXCLUDE_FIELDS = [
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
  '_key', //
  //  Sanity 배열 항목의 고유 키 (매번 새로 생성되므로 제외)
];

const FIELD_NAME_MAP: Record<string, string> = {
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
  name: '이름',
  clubName: '클럽명',
} as const;

const MEMBER_FIELDS = ['name', 'clubName', 'birth', 'score', 'isRegisteredMember'] as const;

// 유틸리티 함수들
const transformValue = (field: string, value: unknown): string => {
  if (field === 'isFeePaid') {
    return value === true ? '납부' : '미납';
  }
  return value?.toString() || '없음';
};

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

// 팀 멤버 변경사항 추적 함수
const trackTeamMemberChanges = (
  oldMembers: Array<Record<string, unknown>>,
  newMembers: Array<Record<string, unknown>>,
): { field: string; oldValue: string | null; newValue: string | null }[] => {
  const changes = [];

  // 각 참가자별로 변경사항 확인
  for (let i = 0; i < Math.max(oldMembers.length, newMembers.length); i++) {
    const oldMember = oldMembers[i];
    const newMember = newMembers[i];

    if (oldMember && newMember) {
      // 개별 필드별로 변경사항 확인
      let hasMemberChanges = false;
      const memberChanges: string[] = [];

      for (const field of MEMBER_FIELDS) {
        const oldFieldValue = oldMember[field];
        const newFieldValue = newMember[field];

        if (hasSignificantChange(oldFieldValue, newFieldValue)) {
          hasMemberChanges = true;
          const fieldName = FIELD_NAME_MAP[field] || field;
          const oldStr = transformValue(field, oldFieldValue);
          const newStr = transformValue(field, newFieldValue);
          memberChanges.push(`${fieldName}: ${oldStr}`);
          memberChanges.push(`${fieldName}: ${newStr}`);
        }
      }

      if (hasMemberChanges) {
        const memberName = newMember.name?.toString() || `${i + 1}번째 참가자`;

        // 변경사항을 oldValue와 newValue로 분리
        const oldChanges: string[] = [];
        const newChanges: string[] = [];

        for (let j = 0; j < memberChanges.length; j += 2) {
          if (memberChanges[j] && memberChanges[j + 1]) {
            oldChanges.push(memberChanges[j]);
            newChanges.push(memberChanges[j + 1]);
          }
        }

        changes.push({
          field: `${memberName} 정보`,
          oldValue: oldChanges.join(', '),
          newValue: newChanges.join(', '),
        });
      }
    } else if (oldMember && !newMember) {
      // 참가자가 삭제된 경우
      const memberName = oldMember.name?.toString() || `${i + 1}번째 참가자`;
      changes.push({
        field: '참가자 삭제',
        oldValue: `${memberName} 삭제됨`,
        newValue: null,
      });
    } else if (!oldMember && newMember) {
      // 참가자가 추가된 경우
      const memberName = newMember.name?.toString() || `${i + 1}번째 참가자`;
      changes.push({
        field: '참가자 추가',
        oldValue: null,
        newValue: `${memberName} 추가됨`,
      });
    }
  }

  return changes;
};

export function trackChanges(
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>,
): { field: string; oldValue: string | null; newValue: string | null }[] {
  const changes = [];

  for (const key in newData) {
    // 시스템 필드 제외
    if (EXCLUDE_FIELDS.includes(key)) {
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
        // teamMembers 배열인 경우 개별 참가자별로 변경사항 비교
        if (key === 'teamMembers' && Array.isArray(oldValue) && Array.isArray(newValue)) {
          const teamMemberChanges = trackTeamMemberChanges(
            oldValue as Array<Record<string, unknown>>,
            newValue as Array<Record<string, unknown>>,
          );
          changes.push(...teamMemberChanges);
        } else {
          // 다른 객체 필드의 경우 JSON 비교
          const oldObjStr = oldValue ? JSON.stringify(oldValue) : null;
          const newObjStr = newValue ? JSON.stringify(newValue) : null;

          if (hasSignificantChange(oldObjStr, newObjStr)) {
            changes.push({
              field: FIELD_NAME_MAP[key] || key,
              oldValue: oldObjStr,
              newValue: newObjStr,
            });
          }
        }
      }
    } else {
      // 일반 필드 처리 - 실제로 변경된 경우만 추가
      if (hasSignificantChange(oldValue, newValue)) {
        const fieldName = FIELD_NAME_MAP[key] || key;

        const oldStr = transformValue(key, oldValue);
        const newStr = transformValue(key, newValue);

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
