'use client';
import { useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, Tabs, Button } from '@radix-ui/themes';
import { Plus } from 'lucide-react';
import AwardList from '@/components/AwardList';
import ConfirmDialog from '@/components/ConfirmDialog';
import Container from '@/components/Container';
import SkeletonCard from '@/components/SkeletonCard';
import { useUser } from '@/hooks/useUser';
import { useAwards } from '@/hooks/useAwards';
import { useLoading } from '@/hooks/useLoading';
import { hasPermissionLevel } from '@/lib/authUtils';
import SummaryTable from '@/components/SummaryTable';

export default function AwardsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { user } = useUser(session?.user?.email);
  const { awards, isLoading, deleteAward } = useAwards();
  const { loading: actionLoading, withLoading } = useLoading();

  const canManage = user ? hasPermissionLevel(user, 3) : false;

  const handleEdit = (id: string) => router.push(`/awards/${id}/edit`);
  const handleDelete = async (id: string) => {
    await withLoading(async () => {
      try {
        await deleteAward(id);
        setDeleteId(null);
      } catch (error) {
        alert(error instanceof Error ? error.message : '삭제에 실패했습니다.');
      }
    });
  };
  const handleCreate = () => router.push('/awards/create');

  // 요약 데이터(예시: 대회/년도/부서/수상구분별 그룹핑)
  // 실제 요약 로직은 SummaryTable 내부에서 처리하는 것이 더 깔끔할 수 있습니다.
  // 아래는 awards를 그대로 넘기는 예시입니다.
  const summaryAwards = useMemo(() => awards, [awards]);

  // 1. 세션/데이터 로딩 중
  if (isLoading || status === 'loading') {
    return (
      <Container>
        <Card className="p-6">
          <SkeletonCard lines={4} />
        </Card>
      </Container>
    );
  }

  // 2. (선택) 권한 없는 경우 안내 (권한 없는 경우에도 전체보기는 보여주고, 등록/수정/삭제만 막고 싶다면 이 부분은 생략)
  // if (!canManage) {
  //   return (
  //     <Container>
  //       <Card className="p-8 text-center">
  //         <Text size="3">수상 결과를 볼 권한이 없습니다.</Text>
  //       </Card>
  //     </Container>
  //   );
  // }

  return (
    <Container>
      <Tabs.Root defaultValue="summary">
        <Tabs.List>
          <Tabs.Trigger value="summary">요약 보기</Tabs.Trigger>
          <Tabs.Trigger value="all">전체 보기</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="summary">
          <SummaryTable awards={summaryAwards} />
        </Tabs.Content>
        <Tabs.Content value="all">
          <AwardList
            awards={awards}
            onEdit={handleEdit}
            onDelete={(id) => setDeleteId(id)}
            canManage={canManage}
          />
        </Tabs.Content>
      </Tabs.Root>

      {/* 플로팅 등록 버튼 */}
      {canManage && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            size="4"
            onClick={handleCreate}
            disabled={actionLoading}
            style={{
              borderRadius: '50%',
              width: '60px',
              height: '60px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              padding: 0,
              minWidth: 0,
              minHeight: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="수상 결과 등록"
          >
            <Plus size={24} />
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="수상 결과 삭제"
        description="정말로 이 수상 결과를 삭제하시겠습니까?"
        onConfirm={() => {
          if (deleteId) handleDelete(deleteId);
        }}
        onCancel={() => setDeleteId(null)}
        confirmText={actionLoading ? '삭제 중...' : '삭제'}
        confirmColor="red"
        disabled={actionLoading}
      />
    </Container>
  );
}
