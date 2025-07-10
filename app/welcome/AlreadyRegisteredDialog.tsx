'use client';
import { Button, Flex, Text, AlertDialog } from '@radix-ui/themes';
import { useRouter } from 'next/navigation';

export default function AlreadyRegisteredDialog({ open }: { open: boolean }) {
  const router = useRouter();
  return (
    <AlertDialog.Root open={open}>
      <AlertDialog.Content maxWidth="450px">
        <AlertDialog.Title>이미 가입된 회원입니다</AlertDialog.Title>
        <AlertDialog.Description>
          <Text size="4" align="center" mb="5" color="gray">
            이미 등록된 회원 정보가 있습니다.
            <br />
            회원 정보는 프로필에서 수정할 수 있습니다.
          </Text>
        </AlertDialog.Description>

        <Flex gap="3" mt="4" justify="end">
          <Button variant="soft" size="3" onClick={() => router.push('/profile')}>
            프로필로 이동
          </Button>
          <Button variant="soft" size="3" onClick={() => router.push('/')}>
            메인으로 이동
          </Button>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
}
