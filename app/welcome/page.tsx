'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AlreadyRegisteredDialog from './AlreadyRegisteredDialog';
import { useUser } from '@/hooks/useUser';
import { useLoading } from '@/hooks/useLoading';
import LoadingOverlay from '@/components/LoadingOverlay';
import UserForm from '@/components/UserForm';

export default function WelcomePage() {
  const router = useRouter();
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const { data: session } = useSession();
  const email = session?.user?.email;
  const { loading, withLoading } = useLoading();
  const { user, isLoading: userLoading } = useUser(email);
  const [error, setError] = useState('');

  useEffect(() => {
    setAlreadyRegistered(!!user);
  }, [user]);

  const handleSubmit = async (data: {
    name: string;
    email?: string;
    phone: string;
    gender: string;
    birth: string;
    score: number;
    address?: string;
    clubs: string[];
  }) => {
    setError('');
    console.log(data);
    try {
      await withLoading(async () => {
        const response = await fetch('/api/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            email: session?.user?.email,
          }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '회원가입에 실패했습니다.');
        }
        router.push('/signup-success');
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : '회원가입 중 오류가 발생했습니다.');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      {alreadyRegistered && <AlreadyRegisteredDialog open={!!alreadyRegistered} />}
      {session?.user?.email && !userLoading && !alreadyRegistered && (
        <>
          {loading && <LoadingOverlay size="3" />}
          <UserForm
            user={{ email: session.user.email }}
            onSubmit={handleSubmit}
            loading={loading}
            submitText="회원가입 완료"
            mode="signup"
            submitButtonProps={{
              style: { marginTop: 16, width: '100%' },
            }}
          />
          {error && <span style={{ color: 'red', marginTop: 8 }}>{error}</span>}
        </>
      )}
    </div>
  );
}
