'use client';
import SocialAuthButtons from '@/components/SocialAuthButtons';
import { Flex, Separator, Text, Button } from '@radix-ui/themes';
import { Suspense, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function SignupSuccessPage() {
  const { data: session } = useSession();
  const router = useRouter();

  // 페이지 진입 시 자동 로그아웃
  useEffect(() => {
    if (session) {
      signOut({ redirect: false });
    }
  }, [session]);

  return (
    <Flex direction="column" align="center" justify="center" style={{ minHeight: '60vh' }}>
      <Text size="5" weight="bold" mb="4">
        회원가입이 완료되었습니다!
      </Text>
      <Text size="3" mb="6">
        다시 로그인 해주세요.
      </Text>
      <Separator my="4" size="4" />
      <Suspense fallback={<div>로딩 중...</div>}>
        <SocialAuthButtons mode="login" />
      </Suspense>
      <Button variant="soft" size="3" mt="4" onClick={() => router.push('/')}>
        홈으로 돌아가기
      </Button>
    </Flex>
  );
}
