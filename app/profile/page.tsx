'use client';
import { Box } from '@radix-ui/themes';
import ProfileForm from './ProfileForm';

export default function ProfilePage() {
  return (
    <Box p="5" maxWidth="500px" mx="auto">
      <ProfileForm />
    </Box>
  );
}
