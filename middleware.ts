import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// 권한이 필요한 경로들
const PROTECTED_ROUTES = {
  '/tournament-applications/admin': 5, // 관리자만
  '/admin': 5, // 관리자만
  '/tournaments/[id]/edit': 5, // 대회 수정은 관리자만
  '/tournaments/create': 5, // 대회 생성은 관리자만
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 권한 체크가 필요한 경로인지 확인
  const requiredLevel = getRequiredLevel(pathname);
  if (requiredLevel === null) {
    return NextResponse.next();
  }

  try {
    // JWT 토큰에서 사용자 정보 가져오기
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }

    // 사용자 권한 레벨 확인
    const userLevel = (token.level as number) || 0;

    if (userLevel < requiredLevel) {
      // 권한이 부족한 경우 접근 거부 페이지로 리다이렉트
      return NextResponse.redirect(new URL('/access-denied', request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware 권한 체크 오류:', error);
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }
}

// 경로에 따른 필요 권한 레벨 반환
function getRequiredLevel(pathname: string): number | null {
  // 정확한 경로 매칭
  if (PROTECTED_ROUTES[pathname as keyof typeof PROTECTED_ROUTES]) {
    return PROTECTED_ROUTES[pathname as keyof typeof PROTECTED_ROUTES];
  }

  // 동적 경로 매칭
  if (pathname.startsWith('/admin/')) {
    return 5; // 모든 admin 경로는 레벨 5 필요
  }

  if (pathname.match(/\/tournaments\/[^\/]+\/edit$/)) {
    return 5; // 대회 수정은 레벨 5 필요
  }

  if (pathname.match(/\/tournaments\/[^\/]+\/applications$/)) {
    return 3; // 대회 신청 목록은 레벨 3 필요
  }

  return null; // 권한 체크 불필요
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/tournament-applications/admin',
    '/tournaments/:path*',
    '/awards/:path*',
    '/club/:path*',
    '/club-member/:path*',
    '/expenses/:path*',
    '/questions/:path*',
    '/posts/:path*',
  ],
};
