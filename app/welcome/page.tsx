'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AlreadyRegisteredDialog from './AlreadyRegisteredDialog';
import { useUser, useUserManagement, type UserData } from '@/hooks/useUser';
import { useLoading } from '@/hooks/useLoading';
import LoadingOverlay from '@/components/LoadingOverlay';
import UserForm from '@/components/UserForm';
import Container from '@/components/Container';

export default function WelcomePage() {
  const router = useRouter();
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const { data: session } = useSession();
  const email = session?.user?.email;
  const { loading, withLoading } = useLoading();
  const { user, isLoading: userLoading } = useUser(email);
  const { signup } = useUserManagement();
  const [error, setError] = useState('');

  useEffect(() => {
    setAlreadyRegistered(!!user);
  }, [user]);

  const handleSubmit = async (data: UserData) => {
    setError('');
    try {
      await withLoading(async () => {
        await signup({
          ...data,
          email: session?.user?.email,
        });
        router.push('/signup-success');
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : '회원가입 중 오류가 발생했습니다.');
    }
  };

  return (
    <Container>
      {alreadyRegistered && <AlreadyRegisteredDialog open={!!alreadyRegistered} />}
      {session?.user?.email && !userLoading && !alreadyRegistered && (
        <>
          {loading && <LoadingOverlay />}
          <UserForm
            user={{ email: session.user.email }}
            onSubmit={handleSubmit}
            loading={loading}
            submitText="회원가입 완료"
            submitButtonProps={{
              style: { marginTop: 16, width: '100%' },
            }}
            showAgreements={true}
          />
          {error && <span style={{ color: 'red', marginTop: 8 }}>{error}</span>}
        </>
      )}
    </Container>
  );
}
