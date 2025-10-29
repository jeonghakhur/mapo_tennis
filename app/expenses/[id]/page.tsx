'use client';
import { Box, Text, Button, Flex, Badge } from '@radix-ui/themes';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import React, { useState } from 'react';
import Container from '@/components/Container';
import { categoryLabels, categoryColors, formatAmount, formatDate } from '@/lib/expenseUtils';
import { useExpense, useExpenses } from '@/hooks/useExpenses';
import { urlFor } from '@/sanity/lib/image';
import type { Expense } from '@/model/expense';
import SkeletonCard from '@/components/SkeletonCard';

// 헤더 컴포넌트
function ExpenseHeader({
  onEdit,
  onBack,
  onDelete,
  deleting,
}: {
  onEdit: () => void;
  onBack: () => void;
  onDelete?: () => void;
  deleting?: boolean;
}) {
  return (
    <Flex justify="end" align="center" mb="4">
      <Flex gap="2">
        <Button variant="soft" onClick={onBack}>
          목록
        </Button>
        <Button variant="soft" onClick={onEdit}>
          수정
        </Button>
        {onDelete && (
          <Button variant="soft" color="red" onClick={onDelete} disabled={deleting}>
            {deleting ? '삭제 중...' : '삭제'}
          </Button>
        )}
      </Flex>
    </Flex>
  );
}

// 기본 정보 테이블 컴포넌트
function ExpenseInfoTable({ expense }: { expense: Expense }) {
  const expenseTypeLabelMap: Record<string, string> = {
    association_fee: '협회비',
    development_fund: '발전기금',
    board_fee: '이사회비',
  };
  return (
    <div className="table-view">
      <table>
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
          {expense.expenseType && (
            <tr>
              <th>구분항목</th>
              <td>
                <Text size="4">
                  {expenseTypeLabelMap[expense.expenseType] || expense.expenseType}
                </Text>
              </td>
            </tr>
          )}
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
    </div>
  );
}

// 이미지 컴포넌트 (영수증/물품 공통)
function ImageSection({
  expense,
  imageType,
  title,
}: {
  expense: Expense;
  imageType: 'receiptImage' | 'productImage';
  title: string;
}) {
  const image = expense[imageType];
  if (!image) {
    return null;
  }

  const handleDownload = async () => {
    try {
      const imageUrl = urlFor(image).url();
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      const defaultName = `${expense.title || 'image'}_${imageType === 'receiptImage' ? 'receipt' : 'product'}.jpg`;
      link.download = defaultName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      console.error('이미지 다운로드 실패:', e);
      alert('이미지 다운로드에 실패했습니다.');
    }
  };

  return (
    <div className="mt-6">
      <Text weight="bold" size="3" mb="2" as="div">
        {title}
      </Text>
      <div className="relative">
        <Image
          src={urlFor(image).url()}
          alt={title}
          width={400}
          height={300}
          style={{
            borderRadius: 8,
            objectFit: 'cover',
            border: '1px solid #ddd',
          }}
        />
      </div>
      <div className="mt-3">
        <Button variant="soft" onClick={handleDownload}>
          이미지 다운로드
        </Button>
      </div>
    </div>
  );
}

export default function ExpenseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const { expense, loading, error } = useExpense(id);
  const { deleteExpense } = useExpenses({ autoFetch: false });
  const [deleting, setDeleting] = useState(false);

  if (loading) {
    return (
      <Container>
        <SkeletonCard />
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

  const handleDelete = async () => {
    if (!confirm('정말로 이 지출내역을 삭제하시겠습니까?')) {
      return;
    }

    setDeleting(true);
    try {
      await deleteExpense(id);
      alert('지출내역이 삭제되었습니다.');
      router.push('/expenses');
    } catch (error) {
      console.error('지출내역 삭제 실패:', error);
      alert('삭제에 실패했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Container>
      <ExpenseHeader
        onEdit={handleEdit}
        onBack={handleBack}
        onDelete={handleDelete}
        deleting={deleting}
      />

      <div className="space-y-6">
        {/* 기본 정보 */}
        <ExpenseInfoTable expense={expense} />

        {/* 영수증 이미지 */}
        <ImageSection expense={expense} imageType="receiptImage" title="영수증 이미지" />

        {/* 물품 이미지 */}
        <ImageSection expense={expense} imageType="productImage" title="물품 이미지" />
      </div>
    </Container>
  );
}
