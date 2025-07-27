export interface Notification {
  _id: string;
  _type: 'notification';
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entityType:
    | 'CLUB_MEMBER'
    | 'CLUB'
    | 'POST'
    | 'TOURNAMENT_APPLICATION'
    | 'USER'
    | 'EXPENSE'
    | 'TOURNAMENT'
    | 'QUESTION';
  entityId: string;
  title: string;
  message: string;
  link?: string; // 바로가기 링크
  changes?: Change[];
  readAt?: string;
  userId?: string;
  createdAt: string;
}

export interface Change {
  _key?: string; // Sanity에서 자동 생성되는 키
  field: string;
  oldValue: string | null;
  newValue: string | null;
}

export interface NotificationInput {
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entityType:
    | 'CLUB_MEMBER'
    | 'CLUB'
    | 'POST'
    | 'TOURNAMENT_APPLICATION'
    | 'USER'
    | 'EXPENSE'
    | 'TOURNAMENT'
    | 'QUESTION';
  entityId: string;
  title: string;
  message: string;
  link?: string; // 바로가기 링크
  changes?: Change[];
  userId?: string;
}
