'use client';
import SocialAuthButtons from '@/components/SocialAuthButtons';
import { Flex, Separator, Text } from '@radix-ui/themes';
import { Suspense } from 'react';

export default function SignupSuccessPage() {
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
    </Flex>
  );
}
