'use client';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getUserById } from '@/service/user';
import { useLoading } from '@/hooks/useLoading';
import SkeletonCard from '@/components/SkeletonCard';
import Container from '@/components/Container';
import ConfirmDialog from '@/components/ConfirmDialog';
import UserForm from '@/components/UserForm';
import { useUserManagement, type UserData } from '@/hooks/useUser';
import type { User } from '@/model/user';
import LoadingOverlay from '@/components/LoadingOverlay';

// clubs의 타입을 명확히 지정
interface ClubRef {
  _id?: string;
  _ref?: string;
  _key?: string;
  name?: string;
}

export default function AdminUserEditPage() {
  const params = useParams();
  const userId = params.id as string;
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const { withLoading, loading } = useLoading();
  const [isApprovedUser, setIsApprovedUser] = useState<boolean | undefined>(undefined);
  const { updateUser } = useUserManagement();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const userData = await getUserById(userId);
        if (userData) {
          setUser(userData);
          // clubs가 있으면 첫 번째 클럽 기준으로 clubMember의 approvedByAdmin을 불러옴
          if (userData && userData.clubs && userData.clubs.length > 0) {
            const club = userData.clubs[0] as ClubRef;
            const clubId = club._id;
            if (clubId) {
              // User의 isApprovedUser를 사용
              setIsApprovedUser(userData.isApprovedUser ?? false);
            } else {
              setIsApprovedUser(false);
            }
          } else {
            setIsApprovedUser(false);
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    if (userId) fetchUser();
  }, [userId]);

  const handleSubmit = async (data: UserData & { isApprovedUser?: boolean }) => {
    try {
      await withLoading(async () => {
        console.log('수정할 데이터:', data); // 디버깅 로그

        // User 업데이트와 클럽 승인을 병렬로 처리
        const updatePromises = [updateUser(data)];

        // 관리자 승인 처리 (병렬)
        if (data.isApprovedUser && data.clubs && data.clubs.length > 0) {
          console.log('클럽 승인 처리 시작'); // 디버깅 로그

          const approvePromises = data.clubs.map((clubId) =>
            fetch('/api/club-member/approve', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user: data.name,
                clubId,
                email: data.email,
                phone: (data as UserData).phone,
                gender: (data as UserData).gender,
                birth: (data as UserData).birth,
                score: (data as UserData).score,
              }),
            }),
          );

          updatePromises.push(...approvePromises);
        }

        // 모든 업데이트를 병렬로 실행
        await Promise.all(updatePromises);

        // 수정 완료 후 사용자 데이터 다시 로드
        const updatedUserData = await getUserById(userId);
        console.log('업데이트된 사용자 데이터:', updatedUserData); // 디버깅 로그
        if (updatedUserData) {
          setUser(updatedUserData);
          setIsApprovedUser(updatedUserData.isApprovedUser ?? false);
        }

        setSuccessMessage('회원 정보가 성공적으로 수정되었습니다.');
        setShowSuccessDialog(true);
      });
    } catch (error) {
      console.error('수정 중 오류:', error);
    }
  };

  return (
    <Container>
      {isLoading ? (
        <SkeletonCard lines={4} />
      ) : (
        <>
          {loading && <LoadingOverlay />}
          <UserForm
            user={{ ...user, isApprovedUser }}
            onSubmit={handleSubmit}
            loading={false} // loading state removed
            submitText="회원 정보 수정"
            isAdmin={true}
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
