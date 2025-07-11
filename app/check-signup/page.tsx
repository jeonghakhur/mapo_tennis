'use client';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { useEffect, useState } from 'react';
import { Button, Box, Text, Flex, Card, Spinner } from '@radix-ui/themes';

export default function CheckSignupPage() {
  const { data: session, status } = useSession();
  const { replace, push } = useRouter();
  const searchParams = useSearchParams();

  // 1) 콜백 URL 안전 처리
  const callbackUrlRaw = searchParams.get('callbackUrl');
  const callbackUrl = callbackUrlRaw?.startsWith('/') ? callbackUrlRaw : '/';

  // 2) 세션 인증 시에만 사용자 조회
  const email = status === 'authenticated' ? session?.user?.email : undefined;
  const { user, isLoading, error } = useUser(email);

  const [showSignupPrompt, setShowSignupPrompt] = useState(false);

  useEffect(() => {
    if (status !== 'authenticated' || isLoading) return;

    if (user) {
      replace(callbackUrl === '/check-signup' ? '/' : callbackUrl);
    } else {
      setShowSignupPrompt(true);
    }
  }, [status, isLoading, user, callbackUrl, replace]);

  if (status === 'loading' || isLoading) {
    return (
      <Flex justify="center" align="center" style={{ minHeight: '60vh' }}>
        <Spinner size="3" />
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex justify="center" align="center" style={{ minHeight: '60vh' }}>
        <Text color="red">회원 정보 확인 중 오류가 발생했습니다.</Text>
      </Flex>
    );
  }

  return (
    showSignupPrompt && (
      <Box p="5">
        <Card size="3">
          <Flex direction="column" align="center" justify="center" style={{ minHeight: '60vh' }}>
            <Text size="6" weight="bold" mb="4">
              회원가입이 필요합니다
            </Text>
            <Text size="4" color="gray" mb="5">
              서비스 이용을 위해 추가 정보 입력이 필요합니다.
            </Text>
            <Button size="4" radius="large" onClick={() => push('/welcome')}>
              회원가입 하러가기
            </Button>
          </Flex>
        </Card>
      </Box>
    )
  );
}
