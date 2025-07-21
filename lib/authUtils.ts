import type { User } from '@/model/user';
import type { TournamentApplication } from '@/model/tournamentApplication';

// 관리자 권한 확인 (레벨 5 이상)
export function isAdmin(user?: User | null): boolean {
  return Boolean(user?.level && user.level >= 5);
}

// 중간 관리자 권한 확인 (레벨 4 이상)
export function isModerator(user?: User | null): boolean {
  return Boolean(user?.level && user.level >= 4);
}

// 본인 또는 관리자 권한 확인
export function isOwnerOrAdmin(user?: User | null, resourceCreatedBy?: string): boolean {
  if (!user?._id) return false;
  return isAdmin(user) || resourceCreatedBy === user._id;
}

// 참가신청 관련 권한 확인
export function canManageTournamentApplication(
  user: User | null | undefined,
  application: TournamentApplication | undefined,
  action: 'read' | 'update' | 'delete' | 'status_change',
): boolean {
  if (!user?._id || !application) return false;

  const admin = isAdmin(user);
  const owner = application.createdBy === user._id;

  switch (action) {
    case 'read':
      return admin || owner;
    case 'update':
      if (!admin && !owner) return false;
      // 일반 사용자는 승인된 신청 수정 불가
      return admin || application.status !== 'approved';
    case 'delete':
      if (!admin && !owner) return false;
      // 승인된 신청은 삭제 불가 (관리자도 불가)
      return application.status !== 'approved';
    case 'status_change':
      // 상태 변경은 관리자만 가능
      return admin;
    default:
      return false;
  }
}

// 권한 레벨 상수
export const PERMISSION_LEVELS = {
  USER: 1,
  MODERATOR: 4,
  ADMIN: 5,
} as const;

// 권한 레벨 확인
export function hasPermissionLevel(user: User | null | undefined, requiredLevel: number): boolean {
  return Boolean(user?.level && user.level >= requiredLevel);
}
