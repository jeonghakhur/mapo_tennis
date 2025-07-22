'use client';
import Link from 'next/link';
import { Flex, Button, Badge, DropdownMenu } from '@radix-ui/themes';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useNotifications } from '@/hooks/useNotifications';
import { useUser } from '@/hooks/useUser';
import { ArrowLeft, Menu, User, LogOut, BellRing, House } from 'lucide-react';
import { isAdmin, hasPermissionLevel } from '@/lib/authUtils';

export default function Navbar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser(session?.user?.email);

  // 관리자 권한 확인
  const admin = isAdmin(user);
  const { unreadCount } = useNotifications(admin ? undefined : user?._id);

  // 뒤로가기 가능한 페이지인지 확인
  const canGoBack = pathname !== '/' && !pathname.startsWith('/auth');

  const handleGoBack = () => {
    if (canGoBack) {
      router.back();
    }
  };

  return (
    <nav
      style={{
        borderBottom: '1px solid #eee',
        background: '#fff',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        height: '56px',
      }}
    >
      <Flex align="center" px="4" py="3" justify="between">
        {/* 좌측: 뒤로가기 버튼 또는 홈 링크 */}
        <Flex align="center" gap="3">
          {canGoBack ? (
            <Button variant="ghost" size="2" onClick={handleGoBack} style={{ padding: '4px 8px' }}>
              <ArrowLeft size={24} className="text-gray-800" />
            </Button>
          ) : (
            <Link
              href="/"
              style={{ textDecoration: 'none' }}
              className="absolute left-1/2 -translate-x-1/2 text-center block flex-1 font-bold text-xl"
            >
              마포구 테니스 협회
            </Link>
          )}
        </Flex>

        {/* 중앙: 페이지 제목 (뒤로가기 가능한 페이지에서만 표시) */}
        {canGoBack && (
          <Flex
            align="center"
            className="absolute left-1/2 -translate-x-1/2 text-center block flex-1 font-bold text-xl"
          >
            {getPageTitle(pathname)}
          </Flex>
        )}

        {/* 우측: 알림 및 햄버거 메뉴 */}
        <Flex align="center" gap="2">
          <Link href="/" style={{ textDecoration: 'none' }}>
            <House size={24} className="text-gray-800" />
          </Link>
          {/* 알림 버튼 */}
          <Link href="/notifications" style={{ textDecoration: 'none', position: 'relative' }}>
            <BellRing size={24} className="text-gray-800" />
            {session && user?._id && unreadCount > 0 && pathname !== '/welcome' && (
              <Badge
                color="red"
                variant="solid"
                size="1"
                radius="full"
                style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-6px',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                }}
              >
                {unreadCount}
              </Badge>
            )}
          </Link>

          {/* 햄버거 메뉴 */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <Button variant="ghost" size="2" style={{ padding: '4px 8px' }}>
                <Menu size={28} strokeWidth={2} className="text-gray-800" />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              {status === 'authenticated' && session && (
                <DropdownMenu.Item onClick={() => router.push('/profile')}>
                  <User size={14} />
                  프로필
                </DropdownMenu.Item>
              )}
              {hasPermissionLevel(user, 4) && (
                <DropdownMenu.Item onClick={() => router.push('/club')}>클럽</DropdownMenu.Item>
              )}
              {hasPermissionLevel(user, 4) && (
                <DropdownMenu.Item onClick={() => router.push('/club-member')}>
                  클럽멤버
                </DropdownMenu.Item>
              )}
              {hasPermissionLevel(user, 4) && (
                <DropdownMenu.Item onClick={() => router.push('/posts')}>포스트</DropdownMenu.Item>
              )}
              {hasPermissionLevel(user, 4) && (
                <DropdownMenu.Item onClick={() => router.push('/expenses')}>
                  지출내역
                </DropdownMenu.Item>
              )}
              <DropdownMenu.Item onClick={() => router.push('/tournaments')}>
                대회일정
              </DropdownMenu.Item>
              {!admin && (
                <DropdownMenu.Item onClick={() => router.push('/tournament-applications')}>
                  내 참가신청
                </DropdownMenu.Item>
              )}
              {admin && (
                <DropdownMenu.Item onClick={() => router.push('/tournament-applications/admin')}>
                  전체 참가신청 목록
                </DropdownMenu.Item>
              )}
              {admin && (
                <DropdownMenu.Item onClick={() => router.push('/admin/users')}>
                  회원 관리
                </DropdownMenu.Item>
              )}
              <DropdownMenu.Separator />
              {status === 'loading' ? null : !session ? (
                <>
                  <DropdownMenu.Item onClick={() => router.push('/auth/signin')}>
                    로그인
                  </DropdownMenu.Item>
                  <DropdownMenu.Item onClick={() => router.push('/auth/signup')}>
                    회원가입
                  </DropdownMenu.Item>
                </>
              ) : (
                <DropdownMenu.Item
                  color="red"
                  onClick={async () => {
                    try {
                      await signOut({
                        callbackUrl: '/',
                        redirect: true,
                      });
                    } catch (error) {
                      console.error('로그아웃 실패:', error);
                      window.location.href = '/';
                    }
                  }}
                >
                  <LogOut size={14} />
                  로그아웃
                </DropdownMenu.Item>
              )}
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </Flex>
      </Flex>
    </nav>
  );
}

function getPageTitle(pathname: string): string {
  const titleMap: Record<string, string> = {
    '/club': '클럽',
    '/club-member': '클럽멤버',
    '/posts': '포스트',
    '/posts/create': '포스트 작성',
    '/expenses': '지출내역',
    '/tournaments': '대회일정',
    '/notifications': '알림',
    '/profile': '프로필',
    '/tournament-applications/admin': '전체 참가신청 목록',
    '/admin/users': '회원 관리',
    '/welcome': '회원 가입',
  };

  // 1. 정확히 일치하는 경로 우선
  if (titleMap[pathname]) return titleMap[pathname];

  // 2. 동적 라우트 처리
  if (pathname.startsWith('/posts/') && pathname.includes('/edit')) return '포스트 수정';
  if (pathname.startsWith('/posts/')) return '포스트 상세';
  if (pathname.startsWith('/club/')) return '클럽 상세';
  if (pathname.startsWith('/club-member/')) return '클럽멤버 상세';
  if (pathname.startsWith('/expenses/')) return '지출내역 상세';
  if (pathname.startsWith('/tournaments/') && pathname.includes('/apply')) return '참가신청';
  if (pathname.startsWith('/tournaments/')) return '대회 상세';
  if (pathname.startsWith('/admin/users/')) return '회원 정보 수정';

  return '페이지';
}
