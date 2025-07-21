import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { getUserByEmail } from '@/service/user';
import type { User } from '@/model/user';
import type { TournamentApplication } from '@/model/tournamentApplication';

// 권한 레벨 상수
export const PERMISSION_LEVELS = {
  READ_ONLY: 1,
  BASIC_USER: 2,
  ADVANCED_USER: 3,
  POST_MANAGER: 4,
  ADMIN: 5,
} as const;

// 사용자 타입 정의
type UserWithLevel = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  level?: number;
};

// 권한 확인 결과 타입
type PermissionResult =
  | { hasPermission: false; error: string; status: number }
  | { hasPermission: true; user: UserWithLevel };

// 기본 권한 확인 함수 (가장 재사용성 높음)
export async function checkPermission(minLevel: number = 1): Promise<PermissionResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      hasPermission: false,
      error: '로그인이 필요합니다.',
      status: 401,
    };
  }

  const userLevel = session.user.level ?? 0;
  if (userLevel < minLevel) {
    return {
      hasPermission: false,
      error: `권한이 없습니다. (필요 레벨: ${minLevel}, 현재 레벨: ${userLevel})`,
      status: 403,
    };
  }

  return {
    hasPermission: true,
    user: session.user as UserWithLevel,
  };
}

// 권한 확인 후 에러 응답 생성
export function createPermissionError(result: { error: string; status: number }) {
  return NextResponse.json({ error: result.error }, { status: result.status });
}

// 범용 권한 확인 래퍼 함수 (가장 재사용성 높음)
export async function withPermission(
  req: NextRequest,
  minLevel: number,
  handler: (req: NextRequest, user: UserWithLevel) => Promise<NextResponse>,
) {
  const permissionResult = await checkPermission(minLevel);

  if (!permissionResult.hasPermission) {
    return createPermissionError(permissionResult);
  }

  return handler(req, permissionResult.user);
}

// 유저 인증 및 정보 조회
export async function authenticateUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { error: NextResponse.json({ error: '로그인 필요' }, { status: 401 }) };
  }

  const user = await getUserByEmail(session.user.email);
  if (!user?._id) {
    return { error: NextResponse.json({ error: '유저 정보 없음' }, { status: 400 }) };
  }

  return { user };
}

// 본인 또는 관리자 권한 확인
export function checkOwnershipOrAdmin(user: User, resourceCreatedBy: string) {
  const isAdmin = user.level && user.level >= 5;
  if (!isAdmin && resourceCreatedBy !== user._id) {
    return { error: NextResponse.json({ error: '권한이 없습니다' }, { status: 403 }) };
  }
  return { isAdmin };
}

// 참가신청 관련 권한 확인 (비즈니스 로직 포함)
export function checkTournamentApplicationPermission(
  user: User,
  application: TournamentApplication,
  action: 'read' | 'update' | 'delete',
) {
  const isAdmin = user.level && user.level >= 5;
  const isOwner = application.createdBy === user._id;

  // 읽기 권한
  if (action === 'read') {
    if (!isAdmin && !isOwner) {
      return { error: NextResponse.json({ error: '권한이 없습니다' }, { status: 403 }) };
    }
  }

  // 수정 권한
  if (action === 'update') {
    if (!isAdmin && !isOwner) {
      return { error: NextResponse.json({ error: '권한이 없습니다' }, { status: 403 }) };
    }
    // 일반 사용자는 승인된 신청 수정 불가
    if (!isAdmin && application.status === 'approved') {
      return {
        error: NextResponse.json({ error: '승인된 신청은 수정할 수 없습니다' }, { status: 400 }),
      };
    }
  }

  // 삭제 권한
  if (action === 'delete') {
    if (!isAdmin && !isOwner) {
      return { error: NextResponse.json({ error: '권한이 없습니다' }, { status: 403 }) };
    }
    // 승인된 신청은 삭제 불가 (관리자도 불가)
    if (application.status === 'approved') {
      return {
        error: NextResponse.json({ error: '승인된 신청은 삭제할 수 없습니다' }, { status: 400 }),
      };
    }
  }

  return { isAdmin, isOwner };
}

// 알림 대상 사용자 ID 결정
export function getNotificationUserId(isAdmin: boolean, resourceCreatedBy: string) {
  return isAdmin ? undefined : resourceCreatedBy;
}
