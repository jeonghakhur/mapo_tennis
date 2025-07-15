'use client';
import { useState, useEffect } from 'react';
import { Box, Text, Button, Flex, Badge } from '@radix-ui/themes';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import type { Expense } from '@/model/expense';
import { urlFor } from '@/sanity/lib/image';
import React from 'react';
import Container from '@/components/Container';
import { categoryLabels, categoryColors, formatAmount, formatDate } from '@/lib/expenseUtils';

export default function ExpenseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchExpense = async () => {
      try {
        const response = await fetch(`/api/expenses/${id}`);
        if (!response.ok) {
          throw new Error('지출내역을 찾을 수 없습니다.');
        }
        const data = await response.json();
        setExpense(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '지출내역을 불러올 수 없습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchExpense();
  }, [id]);

  if (loading) {
    return (
      <Box className="max-w-2xl mx-auto mt-8 p-6">
        <Text>로딩 중...</Text>
      </Box>
    );
  }

  if (error || !expense) {
    return (
      <Box className="max-w-2xl mx-auto mt-8 p-6">
        <Text color="red">{error || '지출내역을 찾을 수 없습니다.'}</Text>
        <Button onClick={() => router.push('/expenses')} mt="3">
          목록으로 돌아가기
        </Button>
      </Box>
    );
  }

  return (
    <Container>
      <Box className="max-w-2xl mx-auto mt-8 p-6 border rounded-lg bg-white">
        <Flex justify="between" align="center" mb="4">
          <Text size="6" weight="bold">
            지출내역 상세
          </Text>
          <Flex gap="2">
            <Button variant="soft" onClick={() => router.push(`/expenses/${id}/edit`)}>
              수정
            </Button>
            <Button variant="soft" onClick={() => router.push('/expenses')}>
              목록으로
            </Button>
          </Flex>
        </Flex>

        <Box className="space-y-4">
          <div>
            <Text weight="bold" size="3" color="gray">
              제목
            </Text>
            <Text size="4" weight="medium">
              {expense.title}
            </Text>
          </div>

          {expense.storeName && (
            <div>
              <Text weight="bold" size="3" color="gray">
                매장명
              </Text>
              <Text size="4">{expense.storeName}</Text>
            </div>
          )}

          {expense.address && (
            <div>
              <Text weight="bold" size="3" color="gray">
                주소
              </Text>
              <Text size="4">{expense.address}</Text>
            </div>
          )}

          <div>
            <Text weight="bold" size="3" color="gray">
              금액
            </Text>
            <Text size="5" weight="bold" color="red">
              {formatAmount(expense.amount)}원
            </Text>
          </div>

          <div>
            <Text weight="bold" size="3" color="gray">
              카테고리
            </Text>
            <Badge color={categoryColors[expense.category]}>
              {categoryLabels[expense.category]}
            </Badge>
          </div>

          <div>
            <Text weight="bold" size="3" color="gray">
              지출일
            </Text>
            <Text size="4">{formatDate(expense.date)}</Text>
          </div>

          {expense.description && (
            <div>
              <Text weight="bold" size="3" color="gray">
                설명
              </Text>
              <Text size="4">{expense.description}</Text>
            </div>
          )}

          {expense.receiptImage && (
            <div>
              <Text weight="bold" size="3" color="gray" mb="2">
                영수증 이미지
              </Text>
              <Box className="border rounded-lg overflow-hidden">
                <Image
                  src={urlFor(expense.receiptImage).url()}
                  alt="영수증"
                  width={400}
                  height={300}
                  style={{
                    width: '100%',
                    height: 'auto',
                    objectFit: 'cover',
                  }}
                />
              </Box>
            </div>
          )}

          <div>
            <Text weight="bold" size="3" color="gray">
              작성자
            </Text>
            <Text size="4">{expense.author}</Text>
          </div>

          <div>
            <Text weight="bold" size="3" color="gray">
              생성일
            </Text>
            <Text size="4" color="gray">
              {formatDate(expense.createdAt)}
            </Text>
          </div>

          {expense.updatedAt && (
            <div>
              <Text weight="bold" size="3" color="gray">
                수정일
              </Text>
              <Text size="4" color="gray">
                {formatDate(expense.updatedAt)}
              </Text>
            </div>
          )}

          {expense.extractedText && (
            <div>
              <Text weight="bold" size="3" color="gray">
                추출된 텍스트
              </Text>
              <Box className="bg-gray-50 p-3 rounded text-sm">
                <pre className="whitespace-pre-wrap">{expense.extractedText}</pre>
              </Box>
            </div>
          )}
        </Box>
      </Box>
    </Container>
  );
}
