'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import SkeletonCard from '@/components/SkeletonCard';
import Container from '@/components/Container';
import ConfirmDialog from '@/components/ConfirmDialog';
import LoadingOverlay from '@/components/LoadingOverlay';
import { useLoading } from '@/hooks/useLoading';
import { getUserById } from '@/service/user';
import { isAdmin } from '@/lib/authUtils';
import UserForm from '@/components/UserForm';
import type { User } from '@/model/user';

export default function AdminUserEditPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { loading, withLoading } = useLoading();

  useEffect(() => {
    if (session && !isAdmin(session.user)) {
      router.replace('/');
    }
  }, [session, router]);

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      try {
        const userData = await getUserById(userId);
        setUser(userData);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    if (userId) fetchUser();
  }, [userId]);

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
    try {
      await withLoading(async () => {
        const response = await fetch('/api/user', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '회원 정보 수정 실패');
        }
        setSuccessMessage('회원 정보가 성공적으로 수정되었습니다.');
        setShowSuccessDialog(true);
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Container>
      {isLoading ? (
        <SkeletonCard lines={4} />
      ) : (
        <>
          {loading && <LoadingOverlay size="3" />}
          <UserForm
            user={user}
            onSubmit={handleSubmit}
            loading={loading}
            submitText="회원 정보 수정"
          />
        </>
      )}
      <ConfirmDialog
        title="수정 완료"
        description={successMessage}
        confirmText="확인"
        confirmVariant="solid"
        confirmColor="green"
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        onConfirm={() => setShowSuccessDialog(false)}
      />
    </Container>
  );
}
