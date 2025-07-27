'use client';
import { Box, Text, Button, Flex, Badge, Card, Select, TextField } from '@radix-ui/themes';
import { Search, Calendar, MapPin, User, Filter, X, NotebookPen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import Container from '@/components/Container';
import { categoryLabels, categoryColors, formatAmount, formatDate } from '@/lib/expenseUtils';
import { useExpenses } from '@/hooks/useExpenses';
import { useExpenseFilters } from '@/hooks/useExpenseFilters';
import SkeletonCard from '@/components/SkeletonCard';
import type { Expense } from '@/model/expense';
import { useSession } from 'next-auth/react';
import { hasPermissionLevel } from '@/lib/authUtils';

// 통계 카드 컴포넌트
function ExpenseStats({ totalAmount, count }: { totalAmount: number; count: number }) {
  return (
    <Card className="p-4 mb-6">
      <Flex align="center" gap="6">
        <div>
          <Text color="gray" mr="2">
            총 지출
          </Text>
          <Text size="4" weight="bold">
            {formatAmount(totalAmount)}원
          </Text>
        </div>
        <div>
          <Text color="gray" mr="2">
            건수
          </Text>
          <Text size="4" weight="bold">
            {count}건
          </Text>
        </div>
      </Flex>
    </Card>
  );
}

// 필터 및 검색 컴포넌트
function ExpenseFilters({
  searchTerm,
  setSearchTerm,
  categoryFilter,
  setCategoryFilter,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
}: {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  categoryFilter: string;
  setCategoryFilter: (category: string) => void;
  sortBy: 'date' | 'amount' | 'title' | 'createdAt';
  setSortBy: (sortBy: 'date' | 'amount' | 'title' | 'createdAt') => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (order: 'asc' | 'desc') => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
}) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const sortOptions = useMemo(
    () => [
      { value: 'date', label: '지출일' },
      { value: 'amount', label: '금액' },
      { value: 'title', label: '제목' },
      { value: 'createdAt', label: '등록일' },
    ],
    [],
  );

  const orderOptions = useMemo(
    () => [
      { value: 'desc', label: '내림차순' },
      { value: 'asc', label: '오름차순' },
    ],
    [],
  );

  const hasActiveFilters = categoryFilter !== 'all' || startDate || endDate;

  return (
    <Card className="p-4 mb-6">
      <div className="space-y-4">
        {/* 기본 검색 영역 */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <TextField.Root
              size="3"
              placeholder="제목, 설명, 작성자로 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            >
              <TextField.Slot>
                <Search size="16" />
              </TextField.Slot>
            </TextField.Root>
          </div>

          {/* 필터 토글 버튼 */}
          <Button
            variant={showAdvancedFilters ? 'solid' : 'soft'}
            size="3"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            <Filter size="16" />
            필터
            {hasActiveFilters && (
              <Badge color="red" size="1" className="ml-1">
                활성
              </Badge>
            )}
          </Button>
        </div>

        {/* 고급 필터 영역 */}
        {showAdvancedFilters && (
          <div className="border-t pt-4 space-y-4">
            {/* 기간 필터 */}
            <div>
              <Text weight="bold" size="3" mb="2">
                기간 검색
              </Text>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Text color="gray" mb="1">
                    시작일
                  </Text>
                  <TextField.Root
                    size="3"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  >
                    <TextField.Slot>
                      <Calendar size="16" />
                    </TextField.Slot>
                  </TextField.Root>
                </div>
                <div>
                  <Text color="gray" mb="1">
                    종료일
                  </Text>
                  <TextField.Root
                    size="3"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  >
                    <TextField.Slot>
                      <Calendar size="16" />
                    </TextField.Slot>
                  </TextField.Root>
                </div>
              </div>
            </div>

            {/* 기존 필터들 */}
            <div className="flex gap-3 items-center">
              <Text weight="bold" size="3" mb="2">
                카테고리
              </Text>
              <Select.Root value={categoryFilter} onValueChange={setCategoryFilter} size="3">
                <Select.Trigger />
                <Select.Content>
                  <Select.Item value="all">전체</Select.Item>
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <Select.Item key={value} value={value}>
                      {label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </div>

            <div className="flex gap-3 items-center">
              <Text weight="bold" size="3">
                정렬기준
              </Text>
              <Select.Root value={sortBy} onValueChange={setSortBy} size="3">
                <Select.Trigger />
                <Select.Content>
                  {sortOptions.map((option) => (
                    <Select.Item key={option.value} value={option.value}>
                      {option.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </div>

            <div className="flex gap-3 items-center">
              <Text weight="bold" size="3">
                정렬순서
              </Text>
              <Select.Root value={sortOrder} onValueChange={setSortOrder} size="3">
                <Select.Trigger />
                <Select.Content>
                  {orderOptions.map((option) => (
                    <Select.Item key={option.value} value={option.value}>
                      {option.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </div>

            {/* 필터 초기화 버튼 */}
            {(hasActiveFilters || startDate || endDate) && (
              <div className="flex justify-end">
                <Button
                  variant="soft"
                  color="gray"
                  onClick={() => {
                    setCategoryFilter('all');
                    setStartDate('');
                    setEndDate('');
                  }}
                >
                  <X size="14" />
                  필터 초기화
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

// 지출내역 카드 컴포넌트
function ExpenseCard({ expense, onClick }: { expense: Expense; onClick: () => void }) {
  return (
    <Card className="p-6 cursor-pointer hover:bg-gray-50 transition-colors" onClick={onClick}>
      <div className="space-y-4">
        {/* 제목과 카테고리 */}
        <div className="flex items-center gap-3">
          <Badge color={categoryColors[expense.category as keyof typeof categoryColors]}>
            {categoryLabels[expense.category as keyof typeof categoryLabels]}
          </Badge>
          <Text size="5" weight="bold" className="block mb-2">
            {expense.title}
          </Text>
        </div>

        {/* 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-red-500 font-bold">₩</span>
              <Text size="3" weight="bold" color="red">
                {formatAmount(expense.amount)}원
              </Text>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={16} />
              <Text>{formatDate(expense.date)}</Text>
            </div>
            {expense.storeName && (
              <div className="flex items-center gap-2">
                <MapPin size={16} />
                <Text>{expense.storeName}</Text>
              </div>
            )}
            <div className="flex items-center gap-2">
              <User size={16} />
              <Text color="gray">{expense.author}</Text>
            </div>
          </div>

          <div className="space-y-2">
            {expense.description && (
              <Text color="gray" className="line-clamp-2">
                {expense.description}
              </Text>
            )}
            {expense.receiptImage && (
              <Badge color="green" size="1">
                📷 영수증
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function ExpensesPage() {
  const { data: session } = useSession();
  const user = session?.user;
  const router = useRouter();
  const { expenses, loading, error } = useExpenses();
  const [completedLoading, setCompletedLoading] = useState(false);

  // 기간 필터 상태 추가
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const {
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    filteredExpenses,
    totalAmount,
  } = useExpenseFilters({ expenses, startDate, endDate });

  useEffect(() => {
    if (user && !hasPermissionLevel(user, 4)) {
      setCompletedLoading(true);
    }
  }, [user]);

  // 권한 체크 (레벨 4 이상)
  if (completedLoading) {
    return (
      <Container>
        <Box>
          <Text color="red" size="4" weight="bold">
            접근 권한이 없습니다.
          </Text>
          <Text color="gray" size="3" style={{ marginTop: '8px' }}>
            지출내역 페이지는 레벨 4 이상의 사용자만 접근할 수 있습니다.
          </Text>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Box>
          <Text color="red">지출내역을 불러올 수 없습니다.</Text>
        </Box>
      </Container>
    );
  }

  return (
    <Container>
      {loading ? (
        <SkeletonCard />
      ) : (
        <Box>
          <div
            style={{
              position: 'fixed',
              bottom: '20px',
              right: '20px',
              zIndex: 1000,
            }}
          >
            <Button
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={() => router.push('/expenses/create')}
            >
              <NotebookPen size={24} />
            </Button>
          </div>

          {/* 통계 */}
          <ExpenseStats totalAmount={totalAmount} count={filteredExpenses.length} />

          {/* 필터 및 검색 */}
          <ExpenseFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
          />

          {/* 지출내역 목록 */}
          {filteredExpenses.length === 0 ? (
            <Card className="p-6 text-center">
              <Text size="3" color="gray">
                {searchTerm || categoryFilter !== 'all' || startDate || endDate
                  ? '검색 결과가 없습니다.'
                  : '지출내역이 없습니다.'}
              </Text>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredExpenses.map((expense) => (
                <ExpenseCard
                  key={expense._id}
                  expense={expense}
                  onClick={() => router.push(`/expenses/${expense._id}`)}
                />
              ))}
            </div>
          )}
        </Box>
      )}
    </Container>
  );
}
