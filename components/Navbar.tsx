'use client';
import Link from 'next/link';
import { Flex, Button, Badge, DropdownMenu, TextField } from '@radix-ui/themes';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
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
  Search,
  X,
} from 'lucide-react';
import { isAdmin, hasPermissionLevel } from '@/lib/authUtils';
import { useState, useEffect, Suspense } from 'react';
import { Session } from 'next-auth';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import type { User as UserType } from '@/model/user';
import Image from 'next/image';

// 네비게이션 아이템 타입 정의
interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ size: number }>;
  requiredLevel?: number;
  adminOnly?: boolean;
  authRequired?: boolean;
}

// 네비게이션 아이템 설정
const NAV_ITEMS: NavItem[] = [
  // 일반 사용자(로그인 필요 없음 또는 authRequired만)
  { path: '/club', label: '클럽', icon: Users },
  { path: '/club-member', label: '클럽멤버', icon: UserCheck, requiredLevel: 4 },
  { path: '/tournaments', label: '대회일정', icon: Calendar },
  { path: '/awards', label: '대회결과', icon: Trophy },
  {
    path: '/tournament-applications',
    label: '참가신청목록',
    icon: ClipboardList,
    requiredLevel: 1,
    // adminOnly: false,
  },

  // 레벨 1 이상 사용자만
  { path: '/questions', label: '1:1 문의', icon: FileText, requiredLevel: 1 },
  { path: '/admin/questions', label: '1:1 문의(전체)', icon: FileText, adminOnly: true },
  // 권한 레벨이 필요한 메뉴(예: 클럽, 클럽멤버, 지출내역)

  { path: '/expenses', label: '지출내역', icon: Receipt, requiredLevel: 4 },
  // 관리자만 볼 수 있는 메뉴
  { path: '/admin/users', label: '회원관리', icon: UserCog, adminOnly: true },
  { path: '/admin/dashboard', label: '대시보드', icon: UserCog, adminOnly: true },
  { path: '/tournament-grouping', label: '조편성', icon: Trophy, adminOnly: true },
];

// 페이지 제목 매핑
const PAGE_TITLES: Record<string, string> = {
  '/club': '클럽',
  '/club-member': '클럽멤버',
  '/expenses': '지출내역',
  '/expenses/create': '지출내역등록',
  '/tournaments': '대회일정',
  '/notifications': '알림',
  '/profile': '프로필',
  '/tournament-applications': '참가신청목록',

  '/admin/users': '회원관리',
  '/welcome': '회원가입',
  '/awards': '대회결과',
  '/awards/create': '대회결과등록',
  '/questions': '문의내역',
  '/questions/create': '문의작성',
  '/admin/questions': '1:1 문의(전체)',
  '/tournament-grouping': '조편성',
  '/tournament-grouping/matches': '예선경기등록',
  '/tournament-grouping/bracket': '예선경기결과',
  '/tournament-grouping/results': '예선조변성결과',
};

// 동적 라우트 제목 매핑
const DYNAMIC_ROUTE_TITLES = [
  { pattern: /^\/club\/.*$/, title: '클럽상세' },
  { pattern: /^\/club-member\/.*$/, title: '클럽멤버상세' },
  { pattern: /^\/expenses\/.*\/edit$/, title: '지출내역수정' },
  { pattern: /^\/expenses\/.*$/, title: '지출내역상세' },
  { pattern: /^\/tournaments\/.*\/apply$/, title: '참가신청' },
  { pattern: /^\/tournaments\/.*\/edit$/, title: '대회수정' },
  { pattern: /^\/tournaments\/.*$/, title: '대회상세' },
  { pattern: /^\/admin\/users\/.*$/, title: '회원정보수정' },
  { pattern: /^\/questions\/.*\/edit$/, title: '1:1 문의수정' },
  { pattern: /^\/questions\/.*$/, title: '1:1 문의상세' },
  { pattern: /^\/admin\/questions\/.*$/, title: '1:1 문의(상세)' },
  { pattern: /^\/tournament-applications\/.*\/edit$/, title: '참가신청수정' },
];

// 페이지 제목 가져오기
function getPageTitle(pathname: string): string {
  // 정확히 일치하는 경로 확인
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];

  // 동적 라우트 확인
  for (const route of DYNAMIC_ROUTE_TITLES) {
    if (route.pattern.test(pathname)) {
      return route.title;
    }
  }

  return '페이지';
}

// 큰글씨 모드 훅
function useBigFontMode() {
  const [bigFont, setBigFont] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const toggleBigFont = () => {
    const newBigFont = !bigFont;
    setBigFont(newBigFont);

    const themeElement = document.querySelector('.radix-themes');
    if (themeElement) {
      themeElement.setAttribute('data-scaling', newBigFont ? '110%' : '100%');
    }

    localStorage.setItem('bigFontMode', newBigFont ? 'true' : 'false');
  };

  useEffect(() => {
    const saved = localStorage.getItem('bigFontMode');
    if (saved === 'true') {
      setBigFont(true);
      const themeElement = document.querySelector('.radix-themes');
      if (themeElement) {
        themeElement.setAttribute('data-scaling', '110%');
      }
    }
    setIsInitialized(true);
  }, []);

  return { bigFont, toggleBigFont, isInitialized };
}

// 네비게이션 아이템 렌더링
function NavigationItems({
  user,
  admin,
  session,
  router,
}: {
  user: UserType | null | undefined;
  admin: boolean;
  session: Session | null;
  router: AppRouterInstance;
}) {
  return (
    <>
      {NAV_ITEMS.map((item) => {
        // 권한 체크
        if (item.requiredLevel && !hasPermissionLevel(user, item.requiredLevel)) return null;
        if (item.adminOnly && !admin) return null;
        if (item.authRequired && !session) return null;
        if (item.adminOnly === false && admin) return null;

        const Icon = item.icon;
        return (
          <DropdownMenu.Item
            key={item.path}
            onClick={() => router.push(item.path)}
            style={{ fontSize: '18px', fontWeight: 'bold' }}
          >
            <Icon size={14} />
            {item.label}
          </DropdownMenu.Item>
        );
      })}
    </>
  );
}

// 인증 관련 메뉴 아이템
function AuthMenuItems({
  session,
  status,
  router,
}: {
  session: Session | null;
  status: string;
  router: AppRouterInstance;
}) {
  const handleLogout = async () => {
    try {
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
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
      try {
        window.location.href = '/';
      } catch (fallbackError) {
        console.error('홈페이지 이동 실패:', fallbackError);
        window.location.reload();
      }
    }
  };

  if (status === 'loading') return null;

  if (!session || (session && session.user?.level === 0)) {
    return (
      <>
        <DropdownMenu.Separator />

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
    );
  }

  return (
    <>
      <DropdownMenu.Separator />
      {/* 로그아웃 - 레벨 1 이상 사용자에게만 표시 */}
      <DropdownMenu.Item
        color="red"
        onClick={handleLogout}
        style={{ fontSize: '18px', fontWeight: 'bold' }}
      >
        <LogOut size={14} />
        로그아웃
      </DropdownMenu.Item>
    </>
  );
}

// 검색 파라미터를 처리하는 컴포넌트
function SearchParamsHandler() {
  const searchParams = useSearchParams();

  // URL에서 검색어 가져오기
  const currentSearchKeyword = (() => {
    try {
      return searchParams.get('search') || '';
    } catch (error) {
      console.error('검색 파라미터 처리 중 오류:', error);
      return '';
    }
  })();

  return <NavbarContent currentSearchKeyword={currentSearchKeyword} />;
}

// 메인 Navbar 컴포넌트
function NavbarContent({ currentSearchKeyword }: { currentSearchKeyword: string }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser(session?.user?.email);
  const { bigFont, toggleBigFont, isInitialized } = useBigFontMode();

  // 검색 관련 상태
  const [showSearch, setShowSearch] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  // 알림이 필요 없는 페이지 목록
  const notificationExcludedPaths = ['/simple', '/studio', '/tiptap'];
  const isNotificationPage = !notificationExcludedPaths.some((path) => pathname.startsWith(path));

  // 관리자 권한 확인
  const admin = isAdmin(user);
  const { unreadCount } = useNotifications(admin ? undefined : user?._id, user?.level, {
    pause: !isNotificationPage,
  });

  // 뒤로가기 가능한 페이지인지 확인
  const canGoBack = pathname !== '/' && !pathname.startsWith('/auth');
  const homePage = pathname === '/';

  const handleGoBack = () => {
    if (canGoBack) {
      router.back();
    }
  };

  // 검색 처리
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      // 홈페이지로 이동하여 검색 결과 표시
      router.push(`/?search=${encodeURIComponent(searchKeyword.trim())}`);
      setSearchKeyword('');
      setShowSearch(false);
    }
  };

  // 검색 취소
  const handleCancelSearch = () => {
    setShowSearch(false);
    setSearchKeyword('');
  };

  // 페이지 변경 시 검색 모드 종료
  useEffect(() => {
    if (pathname !== '/' && showSearch) {
      setShowSearch(false);
      setSearchKeyword('');
    }
  }, [pathname, showSearch]);

  // 초기화가 완료되지 않았으면 로딩 상태 표시
  if (!isInitialized) {
    return (
      <Flex align="center" px="4" py="3" justify="center" className="navbar-loading">
        {/* <div>Loading...</div> */}
      </Flex>
    );
  }

  return (
    <nav className="navbar print-none">
      <Flex align="center" px="4" justify="between" className="h-[42px]">
        {/* 좌측: 뒤로가기 버튼 또는 홈 링크 */}
        <Flex align="center" gap="3">
          {canGoBack ? (
            <Button variant="ghost" size="2" onClick={handleGoBack} style={{ padding: '4px 8px' }}>
              <ArrowLeft size={24} className="text-gray-800" />
            </Button>
          ) : (
            <Image
              src="/logo_home.png"
              alt="마포구테니스협회"
              width={70}
              height={42}
              className="rounded-lg"
            />
          )}
        </Flex>

        {/* 중앙: 페이지 제목, 검색어 표시 또는 검색 필드 */}
        {canGoBack ? (
          <Flex align="center" className="text-xl font-bold absolute left-1/2 -translate-x-1/2">
            {getPageTitle(pathname)}
          </Flex>
        ) : showSearch && pathname === '/' ? (
          <form onSubmit={handleSearch} className="flex-1 max-w-md mx-4">
            <TextField.Root
              size="3"
              placeholder="대회 및 포스트 검색..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              autoFocus
            />
          </form>
        ) : currentSearchKeyword && pathname === '/' ? (
          <Flex align="center" className="text-lg font-bold absolute left-1/2 -translate-x-1/2">
            검색어: &ldquo;{currentSearchKeyword}&rdquo;
          </Flex>
        ) : null}

        {/* 우측: 검색, 홈, 알림 및 햄버거 메뉴 */}
        <Flex align="center" gap="3">
          {!showSearch && (
            <>
              {!homePage && (
                <Link href="/" className="navbar-icon">
                  <House size={24} className="text-gray-800" />
                </Link>
              )}

              {/* 검색어 취소 버튼 - 홈페이지에서 검색어가 있을 때만 */}
              {pathname === '/' && currentSearchKeyword && (
                <Button
                  variant="ghost"
                  size="2"
                  onClick={() => {
                    router.push('/');
                    // 검색어 초기화를 위해 URL 파라미터 제거
                    const url = new URL(window.location.href);
                    url.searchParams.delete('search');
                    router.replace(url.pathname);
                  }}
                  style={{ padding: '4px 8px' }}
                >
                  <X size={24} className="text-gray-800" />
                </Button>
              )}

              {/* 검색 버튼 - 홈페이지에서만 표시 */}
              {pathname === '/' && !currentSearchKeyword && (
                <Button
                  variant="ghost"
                  size="2"
                  onClick={() => setShowSearch(true)}
                  style={{ padding: '4px 8px' }}
                >
                  <Search size={24} className="text-gray-800" />
                </Button>
              )}

              {/* 알림 버튼 - 레벨 1 이상 사용자만 */}
              {session && user?.level && user.level >= 1 && (
                <Link href="/notifications" className="relative">
                  <BellRing size={24} className="text-gray-800" />
                  {unreadCount > 0 && pathname !== '/welcome' && (
                    <Badge
                      color="red"
                      variant="solid"
                      size="1"
                      radius="full"
                      className="absolute -top-2 -right-2"
                    >
                      {unreadCount}
                    </Badge>
                  )}
                </Link>
              )}
            </>
          )}

          {/* 검색 모드일 때 취소 버튼 - 홈페이지에서만 표시 */}
          {showSearch && pathname === '/' && (
            <Button
              variant="ghost"
              size="2"
              onClick={handleCancelSearch}
              style={{ padding: '4px 8px' }}
            >
              <X size={24} className="text-gray-800" />
            </Button>
          )}

          {/* 햄버거 메뉴 */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <Button variant="ghost" size="2" style={{ padding: '4px 8px' }}>
                <Menu size={28} strokeWidth={2} className="text-gray-800" />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content className="navbar-dropdown-menu">
              {/* 프로필 - 레벨 1 이상 사용자만 */}
              {status === 'authenticated' && session && user?.level && user.level >= 1 && (
                <DropdownMenu.Item
                  onClick={() => router.push('/profile')}
                  style={{ fontSize: '18px', fontWeight: 'bold' }}
                >
                  <User size={14} />
                  프로필
                </DropdownMenu.Item>
              )}

              <NavigationItems user={user} admin={admin} session={session} router={router} />

              <DropdownMenu.CheckboxItem
                checked={bigFont}
                onClick={toggleBigFont}
                style={{ fontSize: '18px', fontWeight: 'bold' }}
              >
                <ZoomIn size={14} />
                큰글씨모드
              </DropdownMenu.CheckboxItem>

              <AuthMenuItems session={session} status={status} router={router} />
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </Flex>
      </Flex>
    </nav>
  );
}

// 메인 Navbar 컴포넌트 (Suspense로 감싸기)
export default function Navbar() {
  return (
    <Suspense
      fallback={
        <nav className="navbar">
          <Flex align="center" px="4" py="3" justify="center" className="navbar-loading">
            {/* 로딩 상태 */}
          </Flex>
        </nav>
      }
    >
      <SearchParamsHandler />
    </Suspense>
  );
}
