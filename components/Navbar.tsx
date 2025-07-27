'use client';
import Link from 'next/link';
import { Flex, Button, Badge, DropdownMenu } from '@radix-ui/themes';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useNotifications } from '@/hooks/useNotifications';
import { useUser } from '@/hooks/useUser';
import {
  User,
  Users,
  UserCheck,
  FileText,
  Receipt,
  Calendar,
  Trophy,
  ClipboardList,
  UserCog,
  LogIn,
  UserPlus,
  ArrowLeft,
  Menu,
  LogOut,
  BellRing,
  House,
  ZoomIn,
} from 'lucide-react';
import { isAdmin, hasPermissionLevel } from '@/lib/authUtils';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser(session?.user?.email);
  const [bigFont, setBigFont] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // 알림이 필요 없는 페이지 목록
  const notificationExcludedPaths = ['/simple', '/studio', '/tiptap'];
  const isNotificationPage = !notificationExcludedPaths.some((path) => pathname.startsWith(path));

  // 관리자 권한 확인
  const admin = isAdmin(user);
  const { unreadCount } = useNotifications(admin ? undefined : user?._id, {
    pause: !isNotificationPage,
  });

  // 뒤로가기 가능한 페이지인지 확인
  const canGoBack = pathname !== '/' && !pathname.startsWith('/auth');

  const handleGoBack = () => {
    if (canGoBack) {
      router.back();
    }
  };

  // 큰글씨 모드 토글 함수
  const toggleBigFont = () => {
    const newBigFont = !bigFont;
    setBigFont(newBigFont);

    // Theme의 scaling 변경 - radix-themes 클래스명 사용
    const themeElement = document.querySelector('.radix-themes');
    if (themeElement) {
      themeElement.setAttribute('data-scaling', newBigFont ? '110%' : '100%');
    }

    // localStorage에 저장
    localStorage.setItem('bigFontMode', newBigFont ? 'true' : 'false');
  };

  // 컴포넌트 마운트 시 localStorage에서 값 복원
  useEffect(() => {
    const saved = localStorage.getItem('bigFontMode');
    if (saved === 'true') {
      setBigFont(true);
      // 초기 렌더링 시 scaling 설정
      const themeElement = document.querySelector('.radix-themes');
      if (themeElement) {
        themeElement.setAttribute('data-scaling', '110%');
      }
    }
    setIsInitialized(true);
  }, []);

  // 초기화가 완료되지 않았으면 로딩 상태 표시
  if (!isInitialized) {
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
        <Flex align="center" px="4" py="3" justify="center">
          <div>Loading...</div>
        </Flex>
      </nav>
    );
  }

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
            <DropdownMenu.Content className="navbar-dropdown-menu">
              {status === 'authenticated' && session && (
                <DropdownMenu.Item
                  onClick={() => router.push('/profile')}
                  style={{ fontSize: '18px', fontWeight: 'bold' }}
                >
                  <User size={14} />
                  프로필
                </DropdownMenu.Item>
              )}
              {hasPermissionLevel(user, 4) && (
                <DropdownMenu.Item
                  onClick={() => router.push('/club')}
                  style={{ fontSize: '18px', fontWeight: 'bold' }}
                >
                  <Users size={14} />
                  클럽
                </DropdownMenu.Item>
              )}
              {hasPermissionLevel(user, 4) && (
                <DropdownMenu.Item
                  onClick={() => router.push('/club-member')}
                  style={{ fontSize: '18px', fontWeight: 'bold' }}
                >
                  <UserCheck size={14} />
                  클럽멤버
                </DropdownMenu.Item>
              )}
              {hasPermissionLevel(user, 4) && (
                <DropdownMenu.Item
                  onClick={() => router.push('/posts')}
                  style={{ fontSize: '18px', fontWeight: 'bold' }}
                >
                  <FileText size={14} />
                  포스트
                </DropdownMenu.Item>
              )}
              {hasPermissionLevel(user, 4) && (
                <DropdownMenu.Item
                  onClick={() => router.push('/expenses')}
                  style={{ fontSize: '18px', fontWeight: 'bold' }}
                >
                  <Receipt size="14" />
                  지출내역
                </DropdownMenu.Item>
              )}
              <DropdownMenu.Item
                onClick={() => router.push('/tournaments')}
                style={{ fontSize: '18px', fontWeight: 'bold' }}
              >
                <Calendar size={14} />
                대회일정
              </DropdownMenu.Item>

              <DropdownMenu.Item
                onClick={() => router.push('/awards')}
                style={{ fontSize: '18px', fontWeight: 'bold' }}
              >
                <Trophy size={14} />
                대회결과
              </DropdownMenu.Item>

              {status === 'authenticated' && session && (
                <DropdownMenu.Item
                  onClick={() => router.push('/questions')}
                  style={{ fontSize: '18px', fontWeight: 'bold' }}
                >
                  <FileText size={14} />
                  1:1 문의
                </DropdownMenu.Item>
              )}
              {!admin && (
                <DropdownMenu.Item
                  onClick={() => router.push('/tournament-applications')}
                  style={{ fontSize: '18px', fontWeight: 'bold' }}
                >
                  <ClipboardList size={14} />
                  내참가신청
                </DropdownMenu.Item>
              )}
              {admin && (
                <DropdownMenu.Item
                  onClick={() => router.push('/tournament-applications/admin')}
                  style={{ fontSize: '18px', fontWeight: 'bold' }}
                >
                  <ClipboardList size={14} />
                  전체참가신청목록
                </DropdownMenu.Item>
              )}
              {admin && (
                <DropdownMenu.Item
                  onClick={() => router.push('/admin/users')}
                  style={{ fontSize: '18px', fontWeight: 'bold' }}
                >
                  <UserCog size={14} />
                  회원관리
                </DropdownMenu.Item>
              )}
              {admin && (
                <DropdownMenu.Item
                  onClick={() => router.push('/admin/questions')}
                  style={{ fontSize: '18px', fontWeight: 'bold' }}
                >
                  <FileText size={14} />
                  1:1 문의(전체)
                </DropdownMenu.Item>
              )}

              <DropdownMenu.CheckboxItem
                checked={bigFont}
                onClick={toggleBigFont}
                style={{ fontSize: '18px', fontWeight: 'bold' }}
              >
                <ZoomIn size={14} />
                큰글씨모드
              </DropdownMenu.CheckboxItem>
              <DropdownMenu.Separator />
              {status === 'loading' ? null : !session ? (
                <>
                  <DropdownMenu.Item
                    onClick={() => router.push('/auth/signin')}
                    style={{ fontSize: '18px', fontWeight: 'bold' }}
                  >
                    <LogIn size={14} />
                    로그인
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    onClick={() => router.push('/auth/signup')}
                    style={{ fontSize: '18px', fontWeight: 'bold' }}
                  >
                    <UserPlus size={14} />
                    회원가입
                  </DropdownMenu.Item>
                </>
              ) : (
                <DropdownMenu.Item
                  color="red"
                  onClick={async () => {
                    try {
                      // PWA 관련 문제 방지를 위한 추가 처리
                      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                        // 서비스 워커가 있다면 정리
                        const registrations = await navigator.serviceWorker.getRegistrations();
                        for (const registration of registrations) {
                          await registration.unregister();
                        }
                      }

                      await signOut({
                        callbackUrl: '/',
                        redirect: true,
                      });
                    } catch (error) {
                      console.error('로그아웃 실패:', error);
                      // 강제로 홈페이지로 이동
                      try {
                        window.location.href = '/';
                      } catch (fallbackError) {
                        console.error('홈페이지 이동 실패:', fallbackError);
                        // 최후의 수단으로 페이지 새로고침
                        window.location.reload();
                      }
                    }
                  }}
                  style={{ fontSize: '18px', fontWeight: 'bold' }}
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
    '/posts/create': '포스트작성',
    '/expenses': '지출내역',
    '/tournaments': '대회일정',
    '/notifications': '알림',
    '/profile': '프로필',
    '/tournament-applications': '참가신청목록',
    '/tournament-applications/admin': '전체참가신청목록',
    '/admin/users': '회원관리',
    '/welcome': '회원가입',
    '/awards': '대회결과',
    '/awards/create': '대회결과등록',
    '/questions': '문의내역',
    '/questions/create': '문의작성',
    // '/admin/questions': '1:1 문의(전체)',
  };

  // 1. 정확히 일치하는 경로 우선
  if (titleMap[pathname]) return titleMap[pathname];

  // 2. 동적 라우트 처리
  if (pathname.startsWith('/posts/') && pathname.includes('/edit')) return '포스트수정';
  if (pathname.startsWith('/posts/')) return '포스트상세';
  if (pathname.startsWith('/club/')) return '클럽상세';
  if (pathname.startsWith('/club-member/')) return '클럽멤버상세';
  if (pathname.startsWith('/expenses/')) return '지출내역상세';
  if (pathname.startsWith('/tournaments/') && pathname.includes('/apply')) return '참가신청';
  if (pathname.startsWith('/tournaments/') && pathname.includes('/edit')) return '대회수정';
  if (pathname.startsWith('/tournaments/')) return '대회상세';
  if (pathname.startsWith('/admin/users/')) return '회원정보수정';
  if (pathname.startsWith('/questions/')) return '1:1 문의상세';
  if (pathname.startsWith('/tournament-applications/') && pathname.includes('/edit'))
    return '참가신청수정';

  return '페이지';
}
