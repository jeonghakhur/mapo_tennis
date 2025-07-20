// 알림 링크 생성 유틸리티
export function createNotificationLink(
  entityType: 'CLUB_MEMBER' | 'CLUB' | 'POST' | 'TOURNAMENT_APPLICATION',
  entityId: string,
): string {
  switch (entityType) {
    case 'CLUB_MEMBER':
      return `/club-member/${entityId}`;

    case 'CLUB':
      return `/club/${entityId}`;

    case 'POST':
      return `/posts/${entityId}`;

    case 'TOURNAMENT_APPLICATION':
      // 참가신청의 경우 참가신청 상세 페이지로 이동
      return `/tournament-applications/${entityId}/edit`;

    default:
      return '/';
  }
}

// 엔티티 타입별 기본 링크 생성
export function getDefaultNotificationLink(entityType: string, entityId: string): string {
  switch (entityType) {
    case 'CLUB_MEMBER':
      return `/club-member/${entityId}`;

    case 'CLUB':
      return `/club/${entityId}`;

    case 'POST':
      return `/posts/${entityId}`;

    case 'TOURNAMENT_APPLICATION':
      return `/tournament-applications/${entityId}/edit`;

    default:
      return '/';
  }
}
