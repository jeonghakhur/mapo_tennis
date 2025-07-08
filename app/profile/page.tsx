'use client';
import { Card, Box, Text, Separator } from '@radix-ui/themes';
import ProfileForm from './ProfileForm';

export default function ProfilePage() {
  return (
    <Box
      style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <Card style={{ width: 400, padding: 32, borderRadius: 16, background: '#fff' }}>
        <Text size="5" weight="bold" align="center" mb="4" style={{ color: '#222' }}>
          프로필 정보 수정
        </Text>
        <Text size="2" align="center" mb="5" style={{ color: '#222' }}>
          회원 정보를 수정할 수 있습니다.
        </Text>
        <Separator my="4" size="4" />
        <ProfileForm />
      </Card>
    </Box>
  );
}
