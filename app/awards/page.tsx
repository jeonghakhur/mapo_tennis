'use client';
import { useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, Tabs, Flex, TextField } from '@radix-ui/themes';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
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
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('전체');
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);

  const categoryOptions = [
    { value: '전체', label: '전체' },
    { value: '우승', label: '우승' },
    { value: '준우승', label: '준우승' },
    { value: '3위', label: '3위' },
    { value: '공동3위', label: '공동3위' },
  ];

  const { user } = useUser(session?.user?.email);
  const { awards, isLoading, deleteAward, deleteAllAwards } = useAwards();
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
  const handleDeleteAll = async () => {
    await withLoading(async () => {
      try {
        await deleteAllAwards();
        setDeleteAllOpen(false);
      } catch (error) {
        alert(error instanceof Error ? error.message : '전체 삭제에 실패했습니다.');
      }
    });
  };

  // 요약 데이터(예시: 대회/년도/부서/수상구분별 그룹핑)
  // 실제 요약 로직은 SummaryTable 내부에서 처리하는 것이 더 깔끔할 수 있습니다.
  // 아래는 awards를 그대로 넘기는 예시입니다.
  const summaryAwards = useMemo(() => awards, [awards]);

  // 필터링 로직
  const filteredAwards = useMemo(() => {
    return awards.filter((award) => {
      const keyword = search.trim().toLowerCase();
      const matchKeyword =
        !keyword ||
        award.competition.toLowerCase().includes(keyword) ||
        award.division.toLowerCase().includes(keyword) ||
        award.club.toLowerCase().includes(keyword) ||
        award.players.some((player) => player.toLowerCase().includes(keyword));
      const matchCategory = category === '전체' || award.awardCategory === category;
      return matchKeyword && matchCategory;
    });
  }, [awards, search, category]);

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
      <Tabs.Root defaultValue="all">
        <Tabs.List className="w-full" style={{ width: '100%' }}>
          <Tabs.Trigger value="all" style={{ flex: 1, fontSize: '16px', fontWeight: 'bold' }}>
            전체 보기
          </Tabs.Trigger>
          <Tabs.Trigger value="summary" style={{ flex: 1, fontSize: '16px', fontWeight: 'bold' }}>
            요약 보기
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="all" className="pt-4">
          <Flex direction="row" gap="2" mb="4">
            <TextField.Root
              placeholder="대회명, 부서명, 클럽명 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="3"
              radius="large"
              style={{ minWidth: 200, fontSize: 16 }}
            />
            <Combobox
              options={categoryOptions}
              value={category}
              onValueChange={(v) => {
                if (!v) return;
                setCategory(v);
              }}
              placeholder="수상구분"
              className="flex-1"
            />
            {/* {canManage && awards.length > 0 && (
              <Button
                variant="outline"
                color="red"
                size="sm"
                onClick={() => setDeleteAllOpen(true)}
                disabled={actionLoading}
                style={{ marginLeft: 8, height: 40 }}
              >
                <Trash2 size={18} style={{ marginRight: 4 }} />
                {actionLoading ? '삭제 중...' : '전체 삭제'}
              </Button>
            )} */}
          </Flex>
          <AwardList
            awards={filteredAwards}
            onEdit={handleEdit}
            onDelete={(id) => setDeleteId(id)}
            canManage={canManage}
          />
        </Tabs.Content>
        <Tabs.Content value="summary" className="pt-4">
          <SummaryTable awards={summaryAwards} />
        </Tabs.Content>
      </Tabs.Root>

      {/* 플로팅 등록 버튼 */}
      {canManage && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            size="lg"
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
      {/* 전체 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        open={deleteAllOpen}
        title="전체 삭제"
        description="정말로 모든 수상 결과를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        onConfirm={handleDeleteAll}
        onCancel={() => setDeleteAllOpen(false)}
        confirmText={actionLoading ? '삭제 중...' : '전체 삭제'}
        confirmColor="red"
        disabled={actionLoading}
      />
    </Container>
  );
}
