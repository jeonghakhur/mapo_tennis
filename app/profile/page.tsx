'use client';
import { Box, Text, Separator } from '@radix-ui/themes';
import ProfileForm from './ProfileForm';

export default function ProfilePage() {
  return (
    <Box p="5" maxWidth="500px" mx="auto">
      <Text size="5" weight="bold" align="center" mb="4" mr="2">
        프로필 정보 수정
      </Text>
      <Text size="2" align="center" mb="5">
        회원 정보를 수정할 수 있습니다.
      </Text>
      <Separator my="4" size="4" />
      <ProfileForm />
    </Box>
  );
}
