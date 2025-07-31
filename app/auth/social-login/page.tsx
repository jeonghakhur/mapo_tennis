'use client';
import { Card, Box, Text, Separator } from '@radix-ui/themes';
import SocialAuthButtons from '@/components/SocialAuthButtons';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function SocialLoginContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  return (
    <Card style={{ width: 340, padding: 32, background: '#fff' }}>
      <Text size="5" weight="bold" align="center" style={{ color: '#222' }} as="div">
        소셜 로그인
      </Text>
      <Text size="2" align="center" mb="5" style={{ color: '#222' }}>
        회원가입이 완료되었습니다. 소셜 계정으로 로그인하세요.
        {email && (
          <Text size="2" color="gray" as="div" mt="2">
            등록된 이메일: {email}
          </Text>
        )}
      </Text>
      <Separator my="4" size="4" />
      <SocialAuthButtons mode="login" />
    </Card>
  );
}

export default function SocialLoginPage() {
  return (
    <Box
      style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <Suspense fallback={<div>로딩 중...</div>}>
        <SocialLoginContent />
      </Suspense>
    </Box>
  );
}
