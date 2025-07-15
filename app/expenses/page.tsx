'use client';
import { useState, useEffect } from 'react';
import { Box, Text, Button, Flex, Badge, Card, Select, TextField } from '@radix-ui/themes';
import { Plus, Search, Calendar, DollarSign } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Container from '@/components/Container';
import { categoryLabels, categoryColors } from '@/lib/expenseUtils';

interface Expense {
  _id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  description?: string;
  author: string;
  createdAt: string;
  receiptImage?: {
    asset: {
      _ref: string;
    };
  };
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const router = useRouter();

  // 지출내역 조회
  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/expenses');
      if (!response.ok) {
        throw new Error('지출내역을 불러올 수 없습니다.');
      }
      const data = await response.json();
      setExpenses(data);
      setFilteredExpenses(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 필터링 및 정렬
  useEffect(() => {
    let filtered = expenses;

    // 검색어 필터링
    if (searchTerm) {
      filtered = filtered.filter(
        (expense) =>
          expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          expense.author.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // 카테고리 필터링
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((expense) => expense.category === categoryFilter);
    }

    // 정렬
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case 'date':
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'title':
          aValue = a.title;
          bValue = b.title;
          break;
        default:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredExpenses(filtered);
  }, [expenses, searchTerm, categoryFilter, sortBy, sortOrder]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString() + '원';
  };

  const getTotalAmount = () => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  if (loading) {
    return (
      <Container>
        <Box>
          <Text>지출내역을 불러오는 중...</Text>
        </Box>
      </Container>
    );
  }

  return (
    <Container>
      <Box>
        <Flex align="center" justify="between" mb="4">
          <Text size="6" weight="bold">
            지출내역
          </Text>
          <Button size="3" onClick={() => router.push('/expenses/create')}>
            <Plus size={16} />새 지출내역
          </Button>
        </Flex>

        {/* 통계 */}
        <Card className="p-4 mb-4">
          <Flex align="center" gap="4">
            <div>
              <Text size="2" color="gray">
                총 지출
              </Text>
              <Text size="4" weight="bold">
                {formatAmount(getTotalAmount())}
              </Text>
            </div>
            <div>
              <Text size="2" color="gray">
                건수
              </Text>
              <Text size="4" weight="bold">
                {filteredExpenses.length}건
              </Text>
            </div>
          </Flex>
        </Card>

        {/* 필터 및 검색 */}
        <Card className="p-4 mb-4">
          <Flex gap="3" align="center" wrap="wrap">
            <div className="flex-1 min-w-48">
              <TextField.Root
                placeholder="제목, 설명, 작성자로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              >
                <TextField.Slot>
                  <Search size={16} />
                </TextField.Slot>
              </TextField.Root>
            </div>

            <Select.Root value={categoryFilter} onValueChange={setCategoryFilter}>
              <Select.Trigger />
              <Select.Content>
                <Select.Item value="all">전체 카테고리</Select.Item>
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <Select.Item key={key} value={key}>
                    {label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>

            <Select.Root value={sortBy} onValueChange={setSortBy}>
              <Select.Trigger />
              <Select.Content>
                <Select.Item value="date">날짜순</Select.Item>
                <Select.Item value="amount">금액순</Select.Item>
                <Select.Item value="title">제목순</Select.Item>
              </Select.Content>
            </Select.Root>

            <Button
              variant="soft"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </Flex>
        </Card>

        {/* 지출내역 목록 */}
        {error && (
          <Text color="red" mb="3">
            {error}
          </Text>
        )}

        {filteredExpenses.length === 0 ? (
          <Card className="p-8 text-center">
            <Text size="3" color="gray">
              {searchTerm || categoryFilter !== 'all'
                ? '검색 결과가 없습니다.'
                : '지출내역이 없습니다.'}
            </Text>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredExpenses.map((expense) => (
              <Card
                key={expense._id}
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => router.push(`/expenses/${expense._id}`)}
              >
                <Flex justify="between" align="start" gap="3">
                  <div className="flex-1">
                    <Flex align="center" gap="2" mb="2">
                      <Badge
                        color={categoryColors[expense.category as keyof typeof categoryColors]}
                      >
                        {categoryLabels[expense.category as keyof typeof categoryLabels]}
                      </Badge>
                      <Text size="1" color="gray">
                        {expense.author}
                      </Text>
                    </Flex>

                    <Text size="4" weight="bold" className="block mb-1">
                      {expense.title}
                    </Text>

                    {expense.description && (
                      <Text size="2" color="gray" className="block mb-2">
                        {expense.description}
                      </Text>
                    )}

                    <Flex align="center" gap="4" mb="2">
                      <Flex align="center" gap="1">
                        <Calendar size={14} />
                        <Text size="2">{formatDate(expense.date)}</Text>
                      </Flex>
                      <Flex align="center" gap="1">
                        <DollarSign size={14} />
                        <Text size="2" weight="bold">
                          {formatAmount(expense.amount)}
                        </Text>
                      </Flex>
                    </Flex>
                  </div>

                  <div className="flex gap-2">
                    {expense.receiptImage && (
                      <Button
                        size="2"
                        variant="soft"
                        color="green"
                        onClick={(e) => {
                          e.stopPropagation();
                          // 영수증 버튼 클릭 시 상세 페이지로 이동
                          router.push(`/expenses/${expense._id}`);
                        }}
                      >
                        📷 영수증
                      </Button>
                    )}
                  </div>
                </Flex>
              </Card>
            ))}
          </div>
        )}
      </Box>
    </Container>
  );
}
