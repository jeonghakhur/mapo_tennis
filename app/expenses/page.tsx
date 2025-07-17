'use client';
import { Box, Text, Button, Flex, Badge, Card, Select, TextField } from '@radix-ui/themes';
import { Plus, Search, Calendar, DollarSign, MapPin, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import Container from '@/components/Container';
import { categoryLabels, categoryColors, formatAmount, formatDate } from '@/lib/expenseUtils';
import { useExpenses } from '@/hooks/useExpenses';
import { useExpenseFilters } from '@/hooks/useExpenseFilters';
import SkeletonCard from '@/components/SkeletonCard';
import type { Expense } from '@/model/expense';

// 통계 카드 컴포넌트
function ExpenseStats({ totalAmount, count }: { totalAmount: number; count: number }) {
  return (
    <Card className="p-4 mb-6">
      <Flex align="center" gap="6">
        <div>
          <Text size="2" color="gray">
            총 지출
          </Text>
          <Text size="4" weight="bold">
            {formatAmount(totalAmount)}원
          </Text>
        </div>
        <div>
          <Text size="2" color="gray">
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
}: {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  categoryFilter: string;
  setCategoryFilter: (category: string) => void;
  sortBy: 'date' | 'amount' | 'title' | 'createdAt';
  setSortBy: (sortBy: 'date' | 'amount' | 'title' | 'createdAt') => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (order: 'asc' | 'desc') => void;
}) {
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

  return (
    <Card className="p-4 mb-6">
      <div className="space-y-4">
        {/* 검색 */}
        <div>
          <Text weight="bold" size="3" mb="2">
            검색
          </Text>
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

        {/* 필터 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Text weight="bold" size="3" mb="2">
              카테고리
            </Text>
            <Select.Root value={categoryFilter} onValueChange={setCategoryFilter}>
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

          <div>
            <Text weight="bold" size="3" mb="2">
              정렬 기준
            </Text>
            <Select.Root value={sortBy} onValueChange={setSortBy}>
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

          <div>
            <Text weight="bold" size="3" mb="2">
              정렬 순서
            </Text>
            <Select.Root value={sortOrder} onValueChange={setSortOrder}>
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
        </div>
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
          <Badge color={categoryColors[expense.category as keyof typeof categoryColors]} size="2">
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
              <DollarSign size={16} />
              <Text size="3" weight="bold" color="red">
                {formatAmount(expense.amount)}원
              </Text>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={16} />
              <Text size="2">{formatDate(expense.date)}</Text>
            </div>
            {expense.storeName && (
              <div className="flex items-center gap-2">
                <MapPin size={16} />
                <Text size="2">{expense.storeName}</Text>
              </div>
            )}
            <div className="flex items-center gap-2">
              <User size={16} />
              <Text size="2" color="gray">
                {expense.author}
              </Text>
            </div>
          </div>

          <div className="space-y-2">
            {expense.description && (
              <Text size="2" color="gray" className="line-clamp-2">
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
  const router = useRouter();
  const { expenses, loading, error } = useExpenses();
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
  } = useExpenseFilters({ expenses });

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
          <Flex align="center" justify="between" mb="6">
            <Text size="6" weight="bold">
              지출내역
            </Text>
            <Button size="3" onClick={() => router.push('/expenses/create')}>
              <Plus size={16} />새 지출내역
            </Button>
          </Flex>

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
          />

          {/* 지출내역 목록 */}
          {filteredExpenses.length === 0 ? (
            <Card className="p-6 text-center">
              <Text size="3" color="gray">
                {searchTerm || categoryFilter !== 'all'
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
