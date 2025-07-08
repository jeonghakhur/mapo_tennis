'use client';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { Button, Flex, Text } from '@radix-ui/themes';
import { useRouter } from 'next/navigation';

export default function AlreadyRegisteredDialog({ open }: { open: boolean }) {
  const router = useRouter();
  return (
    <AlertDialog.Root open={open}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay
          style={{ background: 'rgba(0,0,0,0.2)', position: 'fixed', inset: 0, zIndex: 1000 }}
        />
        <AlertDialog.Content
          style={{
            background: '#fff',
            borderRadius: 16,
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
            padding: 32,
            width: 340,
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1001,
          }}
        >
          <AlertDialog.Title asChild>
            <Text size="5" weight="bold" align="center" mb="4">
              이미 가입된 회원입니다
            </Text>
          </AlertDialog.Title>
          <AlertDialog.Description asChild>
            <Text size="3" align="center" mb="5" color="gray">
              이미 등록된 회원 정보가 있습니다.
              <br />
              회원 정보는 프로필에서 수정할 수 있습니다.
            </Text>
          </AlertDialog.Description>
          <Flex gap="3" mt="5" justify="center">
            <Button variant="soft" color="gray" onClick={() => router.push('/profile')}>
              프로필로 이동
            </Button>
            <Button onClick={() => router.push('/')}>메인으로 이동</Button>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
