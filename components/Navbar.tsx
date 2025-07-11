'use client';
import Link from 'next/link';
import { Flex, Button, Text, Avatar } from '@radix-ui/themes';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';

export default function Navbar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  console.log(session);

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
      <Flex align="center" px="5" py="3" gap="3">
        {/* 좌측: 홈 */}
        <Link href="/" style={{ textDecoration: 'none' }}>
          홈
        </Link>
        <Link href="/club" style={{ textDecoration: 'none' }}>
          클럽
        </Link>
        {/* 우측: 로그인/회원가입 또는 사용자 정보/로그아웃 */}
        <Flex align="center" gap="3" ml="auto" style={{ height: '32px' }}>
          {status === 'loading' ? null : !session ? (
            <>
              <Button
                variant="soft"
                onClick={() =>
                  router.push(`/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`)
                }
              >
                로그인
              </Button>
              <Button
                variant="solid"
                onClick={() =>
                  router.push(`/auth/signup?callbackUrl=${encodeURIComponent(pathname)}`)
                }
              >
                회원가입
              </Button>
            </>
          ) : (
            <>
              <Avatar
                src={session.user?.image ?? undefined}
                fallback={session.user?.name?.[0] ?? 'U'}
                size="2"
                radius="full"
                style={{ cursor: 'pointer' }}
                onClick={() => router.push('/profile')}
              />
              <Text size="3">{session.user?.name}</Text>
              <Button variant="soft" color="gray" onClick={() => signOut({ callbackUrl: '/' })}>
                로그아웃
              </Button>
            </>
          )}
        </Flex>
      </Flex>
    </nav>
  );
}
