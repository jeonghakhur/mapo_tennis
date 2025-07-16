'use client';
import Link from 'next/link';
import { Flex, Button, Badge, DropdownMenu, Text } from '@radix-ui/themes';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useNotifications } from '@/hooks/useNotifications';
import { ArrowLeft, Menu, User, LogOut, BellRing } from 'lucide-react';

export default function Navbar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { unreadCount } = useNotifications();

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
              <ArrowLeft size={24} />
            </Button>
          ) : (
            <Link href="/" style={{ textDecoration: 'none' }} className="text-center">
              <Text size="5" weight="bold">
                마포테니스
              </Text>
            </Link>
          )}
        </Flex>

        {/* 중앙: 페이지 제목 (뒤로가기 가능한 페이지에서만 표시) */}
        {canGoBack && (
          <Flex align="center" style={{ flex: 1, justifyContent: 'center' }}>
            <Text size="5" weight="medium">
              {getPageTitle(pathname)}
            </Text>
          </Flex>
        )}

        {/* 우측: 알림 및 햄버거 메뉴 */}
        <Flex align="center" gap="2">
          {/* 알림 버튼 */}
          <Link href="/notifications" style={{ textDecoration: 'none', position: 'relative' }}>
            <Button variant="ghost" size="2" style={{ padding: '4px 8px' }}>
              <BellRing size={24} className="text-gray-800" />
              {unreadCount > 0 && (
                <Badge
                  color="red"
                  size="1"
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    minWidth: '14px',
                    height: '14px',
                    fontSize: '9px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {unreadCount}
                </Badge>
              )}
            </Button>
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
              <DropdownMenu.Item onClick={() => router.push('/club')}>클럽</DropdownMenu.Item>
              <DropdownMenu.Item onClick={() => router.push('/club-member')}>
                클럽멤버
              </DropdownMenu.Item>
              <DropdownMenu.Item onClick={() => router.push('/posts')}>포스트</DropdownMenu.Item>
              <DropdownMenu.Item onClick={() => router.push('/expenses')}>
                지출내역
              </DropdownMenu.Item>
              <DropdownMenu.Item onClick={() => router.push('/tournaments')}>
                대회일정
              </DropdownMenu.Item>
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
                <DropdownMenu.Item color="red" onClick={() => signOut({ callbackUrl: '/' })}>
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

// 페이지 제목을 반환하는 함수
function getPageTitle(pathname: string): string {
  const titleMap: Record<string, string> = {
    '/club': '클럽',
    '/club-member': '클럽멤버',
    '/posts': '포스트',
    '/expenses': '지출내역',
    '/tournaments': '대회일정',
    '/notifications': '알림',
    '/profile': '프로필',
  };

  // 동적 라우트 처리
  if (pathname.startsWith('/club/')) return '클럽 상세';
  if (pathname.startsWith('/club-member/')) return '클럽멤버';
  if (pathname.startsWith('/posts/')) return '포스트';
  if (pathname.startsWith('/expenses/')) return '지출내역';
  if (pathname.startsWith('/tournaments/')) return '대회';

  return titleMap[pathname] || '페이지';
}
