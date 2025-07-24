'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, Text } from '@radix-ui/themes';
import { AwardInput } from '@/model/award';
import AwardForm from '@/components/AwardForm';
import Container from '@/components/Container';
import { useUser } from '@/hooks/useUser';
import { useAwards } from '@/hooks/useAwards';
import { hasPermissionLevel } from '@/lib/authUtils';
import { useLoading } from '@/hooks/useLoading';

export default function CreateAwardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { createAward } = useAwards();
  const { loading, withLoading } = useLoading();

  // useUser 훅 사용
  const { user } = useUser(session?.user?.email);

  // 권한 체크 상태
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    if (user) {
      setHasPermission(hasPermissionLevel(user, 3));
    }
  }, [user]);

  const handleSubmit = async (data: AwardInput): Promise<void> => {
    await withLoading(async () => {
      try {
        await createAward(data);
        alert('수상 결과가 등록되었습니다.');
        router.push('/awards');
      } catch (error) {
        console.error('Error creating award:', error);
        alert(error instanceof Error ? error.message : '등록에 실패했습니다.');
      }
    });
  };

  // 세션/권한 체크가 끝나기 전에는 로딩 UI만 보여줌
  if (status === 'loading' || hasPermission === null) {
    return (
      <Container>
        <Card className="p-6">
          <Text size="5" weight="bold" mb="6" style={{ display: 'block' }}>
            수상 결과 등록
          </Text>
        </Card>
      </Container>
    );
  }

  if (!hasPermission) {
    return (
      <Container>
        <Card className="p-8 text-center">
          <Text size="3">수상 결과를 등록할 권한이 없습니다.</Text>
        </Card>
      </Container>
    );
  }

  return (
    <Container>
      <Text size="5" weight="bold" mb="6" style={{ display: 'block' }}>
        수상 결과 등록
      </Text>
      <Card className="p-6">
        <AwardForm onSubmit={handleSubmit} loading={loading} submitText="등록" />
      </Card>
    </Container>
  );
}
