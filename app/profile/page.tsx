'use client';
import { useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useUser, useUserManagement, type UserData } from '@/hooks/useUser';
import SkeletonCard from '@/components/SkeletonCard';
import Container from '@/components/Container';
import ConfirmDialog from '@/components/ConfirmDialog';
import { isHydrating } from '@/lib/isHydrating';
import LoadingOverlay from '@/components/LoadingOverlay';
import { useLoading } from '@/hooks/useLoading';
import UserForm from '@/components/UserForm';

export default function ProfileForm() {
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const { data: session } = useSession();
  const email = session?.user?.email;
  const { user, isLoading, error: swrError, mutate } = useUser(email);
  const { loading, withLoading } = useLoading();
  const { updateUser } = useUserManagement();

  const handleSubmit = async (data: UserData) => {
    try {
      await withLoading(async () => {
        await updateUser({
          ...data,
          email: session?.user?.email,
        });
        // SWR 캐시 갱신
        await mutate();
        setSuccessMessage('회원 정보가 성공적으로 수정되었습니다.');
        setShowSuccessDialog(true);
      });
    } catch (error) {
      console.error(
        error instanceof Error ? error.message : '회원 정보 수정 중 오류가 발생했습니다.',
      );
    }
  };

  if (swrError)
    return (
      <span style={{ color: 'red', textAlign: 'center' }}>
        회원 정보 조회 중 오류가 발생했습니다.
      </span>
    );

  const hydrating = isHydrating(isLoading, user);

  return (
    <Container>
      {hydrating ? (
        <SkeletonCard lines={4} />
      ) : (
        <>
          {loading && <LoadingOverlay size="3" />}
          <UserForm
            user={user}
            onSubmit={handleSubmit}
            loading={loading}
            showLogout={true}
            onLogout={() => signOut({ callbackUrl: '/' })}
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
