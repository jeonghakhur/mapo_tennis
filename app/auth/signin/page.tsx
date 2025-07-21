import { Card, Box, Text, Separator } from '@radix-ui/themes';
import SocialAuthButtons from '../../../components/SocialAuthButtons';
import { Suspense } from 'react';

export default function SignInPage() {
  return (
    <Box
      style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <Card style={{ width: 340, padding: 32, background: '#fff' }}>
        <Text size="5" weight="bold" align="center" mb="4" style={{ color: '#222' }}>
          로그인
        </Text>
        <Text size="2" align="center" mb="5" style={{ color: '#222' }}>
          소셜 계정으로 로그인하세요.
        </Text>
        <Separator my="4" size="4" />
        <Suspense fallback={<div>로딩 중...</div>}>
          <SocialAuthButtons mode="login" />
        </Suspense>
      </Card>
    </Box>
  );
}
