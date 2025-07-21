// 알림 링크 생성 유틸리티
export function createNotificationLink(
  entityType:
    | 'CLUB_MEMBER'
    | 'CLUB'
    | 'POST'
    | 'TOURNAMENT_APPLICATION'
    | 'USER'
    | 'EXPENSE'
    | 'TOURNAMENT',
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

    case 'USER':
      return `/profile`; // 사용자 정보는 프로필 페이지로

    case 'EXPENSE':
      return `/expenses/${entityId}`;

    case 'TOURNAMENT':
      return `/tournaments/${entityId}`;

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
