'use client';
import { Button, Flex, Avatar, Text } from '@radix-ui/themes';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function AuthButton() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <Text>로딩 중...</Text>;
  }

  if (!session) {
    return (
      <Flex direction="column" gap="5" align="center">
        <Flex direction="row" gap="3">
          <Button
            style={{ background: '#fee500', color: '#181600' }}
            onClick={() => signIn('kakao')}
          >
            카카오로 로그인
          </Button>
          <Button style={{ background: '#03c75a', color: 'white' }} onClick={() => signIn('naver')}>
            네이버로 로그인
          </Button>
          <Button
            style={{ background: '#fff', color: '#222', border: '1px solid #ccc' }}
            onClick={() => signIn('google')}
          >
            구글로 로그인
          </Button>
        </Flex>
        <Flex direction="row" gap="3">
          <Button
            style={{ background: '#fee500', color: '#181600', border: '1px solid #181600' }}
            onClick={() => signIn('kakao', { callbackUrl: '/welcome' })}
          >
            카카오로 회원가입하기
          </Button>
          <Button
            style={{ background: '#03c75a', color: 'white', border: '1px solid #026b38' }}
            onClick={() => signIn('naver', { callbackUrl: '/welcome' })}
          >
            네이버로 회원가입하기
          </Button>
          <Button
            style={{ background: '#fff', color: '#222', border: '1px solid #ccc' }}
            onClick={() => signIn('google', { callbackUrl: '/welcome' })}
          >
            구글로 회원가입하기
          </Button>
        </Flex>
      </Flex>
    );
  }

  return (
    <Flex direction="column" gap="3" align="center">
      <Avatar
        src={session.user?.image ?? undefined}
        fallback={session.user?.name?.[0] ?? 'U'}
        size="3"
        radius="full"
      />
      <Text>{session.user?.name}</Text>
      <Text size="2" color="gray">
        {session.user?.email}
      </Text>
      <Button
        color="gray"
        variant="soft"
        onClick={async () => {
          try {
            // 먼저 세션을 명시적으로 제거
            await signOut({
              callbackUrl: '/',
              redirect: false,
            });

            // 로컬 스토리지와 세션 스토리지 정리
            localStorage.clear();
            sessionStorage.clear();

            // 쿠키 정리 (NextAuth 관련 쿠키만)
            const nextAuthCookies = [
              'next-auth.session-token',
              'next-auth.callback-url',
              'next-auth.csrf-token',
              '__Secure-next-auth.session-token',
              '__Secure-next-auth.callback-url',
              '__Secure-next-auth.csrf-token',
            ];

            nextAuthCookies.forEach((cookieName) => {
              document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            });

            // 페이지 새로고침
            window.location.href = '/';
          } catch (error) {
            console.error('로그아웃 실패:', error);
            // 강제로 페이지 새로고침
            window.location.href = '/';
          }
        }}
      >
        로그아웃
      </Button>
    </Flex>
  );
}
