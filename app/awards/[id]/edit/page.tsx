'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, Text } from '@radix-ui/themes';
import { AwardInput } from '@/model/award';
import AwardForm from '@/components/AwardForm';
import Container from '@/components/Container';
import SkeletonCard from '@/components/SkeletonCard';
import { useUser } from '@/hooks/useUser';
import { useAward, useAwards } from '@/hooks/useAwards';
import { hasPermissionLevel } from '@/lib/authUtils';
import { useLoading } from '@/hooks/useLoading';

interface EditAwardPageProps {
  params: Promise<{ id: string }>;
}

export default function EditAwardPage({ params }: EditAwardPageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [awardId, setAwardId] = useState<string>('');

  // useUser 훅 사용
  const { user } = useUser(session?.user?.email);

  // useAwards 훅 사용
  const { award, isLoading } = useAward(awardId);
  const { updateAward } = useAwards();

  // 액션 로딩 상태 관리
  const { loading: actionLoading, withLoading } = useLoading();

  // 권한 확인
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    if (user) {
      setHasPermission(hasPermissionLevel(user, 3));
    }
  }, [user]);

  // params에서 ID 추출
  useEffect(() => {
    const getParams = async () => {
      const { id } = await params;
      setAwardId(id);
    };
    getParams();
  }, [params]);

  const handleSubmit = async (data: AwardInput): Promise<void> => {
    await withLoading(async () => {
      try {
        await updateAward(awardId, data);
        alert('수상 결과가 수정되었습니다.');
        router.push('/awards');
      } catch (error) {
        console.error('Error updating award:', error);
        alert(error instanceof Error ? error.message : '수정에 실패했습니다.');
      }
    });
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/signin');
    }
  }, [status, router]);

  // 로딩 중일 때 스켈레톤 표시
  if (status === 'loading' || isLoading) {
    // 데이터 또는 권한 체크가 아직 안 끝났을 때
    return <SkeletonCard lines={4} />;
  }

  // 이후에는 session이 항상 존재한다고 가정하고 렌더링

  if (!hasPermission) {
    return (
      <Container>
        <Card className="p-8 text-center">
          <Text size="3">수상 결과를 수정할 권한이 없습니다.</Text>
        </Card>
      </Container>
    );
  }

  if (!award) {
    return (
      <Container>
        <Card className="p-8 text-center">
          <Text size="3">수상 결과를 찾을 수 없습니다.</Text>
        </Card>
      </Container>
    );
  }

  return (
    <Container>
      <Text size="5" weight="bold" mb="6" style={{ display: 'block' }}>
        수상 결과 수정
      </Text>

      <Card className="p-6">
        <AwardForm
          award={award}
          onSubmit={handleSubmit}
          loading={actionLoading}
          submitText="수정"
        />
      </Card>
    </Container>
  );
}
