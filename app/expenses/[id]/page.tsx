'use client';
import { Box, Text, Button, Flex, Badge } from '@radix-ui/themes';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import React from 'react';
import Container from '@/components/Container';
import { categoryLabels, categoryColors, formatAmount, formatDate } from '@/lib/expenseUtils';
import { useExpense } from '@/hooks/useExpenses';
import { urlFor } from '@/sanity/lib/image';
import type { Expense } from '@/model/expense';

// 헤더 컴포넌트
function ExpenseHeader({ onEdit, onBack }: { onEdit: () => void; onBack: () => void }) {
  return (
    <Flex justify="between" align="center" mb="6">
      <Text size="6" weight="bold">
        지출내역 상세
      </Text>
      <Flex gap="2">
        <Button variant="soft" onClick={onEdit}>
          수정
        </Button>
        <Button variant="soft" onClick={onBack}>
          목록으로
        </Button>
      </Flex>
    </Flex>
  );
}

// 기본 정보 테이블 컴포넌트
function ExpenseInfoTable({ expense }: { expense: Expense }) {
  return (
    <table className="table-form">
      <tbody>
        <tr>
          <th style={{ width: '100px' }}>제목</th>
          <td>
            <Text size="4" weight="medium">
              {expense.title}
            </Text>
          </td>
        </tr>
        <tr>
          <th>금액</th>
          <td>
            <Text size="4" weight="bold" color="red">
              {formatAmount(expense.amount)}원
            </Text>
          </td>
        </tr>
        <tr>
          <th>카테고리</th>
          <td>
            <Badge color={categoryColors[expense.category]} size="2">
              {categoryLabels[expense.category]}
            </Badge>
          </td>
        </tr>
        <tr>
          <th>지출일</th>
          <td>
            <Text size="4">{formatDate(expense.date)}</Text>
          </td>
        </tr>
        {expense.storeName && (
          <tr>
            <th>매장명</th>
            <td>
              <Text size="4">{expense.storeName}</Text>
            </td>
          </tr>
        )}
        {expense.address && (
          <tr>
            <th>주소</th>
            <td>
              <Text size="4">{expense.address}</Text>
            </td>
          </tr>
        )}
        {expense.description && (
          <tr>
            <th>설명</th>
            <td>
              <Text size="4">{expense.description}</Text>
            </td>
          </tr>
        )}
        <tr>
          <th>작성자</th>
          <td>
            <Text size="4">{expense.author}</Text>
          </td>
        </tr>
        <tr>
          <th>등록일</th>
          <td>
            <Text size="4">{formatDate(expense.createdAt)}</Text>
          </td>
        </tr>
        {expense.updatedAt && (
          <tr>
            <th>수정일</th>
            <td>
              <Text size="4">{formatDate(expense.updatedAt)}</Text>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

// 영수증 이미지 컴포넌트
function ReceiptImage({ expense }: { expense: Expense }) {
  if (!expense.receiptImage) {
    return null;
  }

  return (
    <div className="mt-6">
      <Text weight="bold" size="3" mb="4">
        영수증 이미지
      </Text>
      <div className="relative">
        <Image
          src={urlFor(expense.receiptImage).url()}
          alt="영수증"
          width={400}
          height={300}
          style={{
            borderRadius: 8,
            objectFit: 'cover',
            border: '1px solid #ddd',
          }}
        />
      </div>
    </div>
  );
}

export default function ExpenseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const { expense, loading, error } = useExpense(id);

  if (loading) {
    return (
      <Container>
        <Box>
          <Text>로딩 중...</Text>
        </Box>
      </Container>
    );
  }

  if (error || !expense) {
    return (
      <Container>
        <Box>
          <Text color="red">{error || '지출내역을 찾을 수 없습니다.'}</Text>
          <Button onClick={() => router.push('/expenses')} mt="3">
            목록으로 돌아가기
          </Button>
        </Box>
      </Container>
    );
  }

  const handleEdit = () => router.push(`/expenses/${id}/edit`);
  const handleBack = () => router.push('/expenses');

  return (
    <Container>
      <ExpenseHeader onEdit={handleEdit} onBack={handleBack} />

      <div className="space-y-6">
        {/* 기본 정보 */}
        <ExpenseInfoTable expense={expense} />

        {/* 영수증 이미지 */}
        <ReceiptImage expense={expense} />
      </div>
    </Container>
  );
}
