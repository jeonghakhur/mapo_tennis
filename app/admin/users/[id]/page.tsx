'use client';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getUserById } from '@/service/user';
import { getClubMemberByUserAndClub } from '@/service/clubMember';
import { useLoading } from '@/hooks/useLoading';
import LoadingOverlay from '@/components/LoadingOverlay';
import SkeletonCard from '@/components/SkeletonCard';
import Container from '@/components/Container';
import ConfirmDialog from '@/components/ConfirmDialog';
import UserForm from '@/components/UserForm';
import type { User } from '@/model/user';

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
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { loading, withLoading } = useLoading();
  const [approvedByAdmin, setApprovedByAdmin] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      try {
        const userData = await getUserById(userId);
        setUser(userData);
        // clubs가 있으면 첫 번째 클럽 기준으로 clubMember의 approvedByAdmin을 불러옴
        if (userData && userData.clubs && userData.clubs.length > 0) {
          const club = userData.clubs[0] as ClubRef;
          const clubId = club._ref || club._id;
          if (clubId) {
            const clubMember = await getClubMemberByUserAndClub(userData.name, clubId as string);
            setApprovedByAdmin(clubMember?.approvedByAdmin ?? false);
          } else {
            setApprovedByAdmin(false);
          }
        } else {
          setApprovedByAdmin(false);
        }
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
    approvedByAdmin?: boolean;
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
        // 관리자 승인 처리
        if (data.approvedByAdmin && data.clubs && data.clubs.length > 0) {
          for (const clubId of data.clubs) {
            await fetch('/api/club-member/approve', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user: data.name,
                clubId,
                email: data.email,
                phone: data.phone,
                gender: data.gender,
                birth: data.birth,
                score: data.score,
                userId: userId,
              }),
            });
          }
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
            user={{ ...user, approvedByAdmin }}
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
