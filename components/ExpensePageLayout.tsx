'use client';
import { Box, Text, Button, Flex } from '@radix-ui/themes';
import { useRouter } from 'next/navigation';
import React from 'react';
import Container from '@/components/Container';
import ExpenseForm from '@/components/ExpenseForm';
import { urlFor } from '@/sanity/lib/image';
import type { Expense } from '@/model/expense';
import Image from 'next/image';

interface ExpensePageLayoutProps {
  // 페이지 정보
  title: string;
  subtitle?: string;
  submitButtonText: string;

  // 폼 관련
  initialData?: {
    title: string;
    storeName: string;
    address: string;
    amount: string;
    category: string;
    date: string;
    description: string;
  };
  onSubmit: (formData: FormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  showImageUpload?: boolean;

  // 수정 페이지 전용
  isEditMode?: boolean;
  expense?: Expense | null;
  onDelete?: () => Promise<void>;
  deleting?: boolean;

  // 로딩 및 에러 상태
  isLoading?: boolean;
  error?: string;
}

export default function ExpensePageLayout({
  title,
  subtitle,
  submitButtonText,
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  showImageUpload = true,
  isEditMode = false,
  expense,
  onDelete,
  deleting = false,
  isLoading = false,
  error,
}: ExpensePageLayoutProps) {
  const router = useRouter();

  // 로딩 상태
  if (isLoading) {
    return (
      <Container>
        <Box>
          <Text>로딩 중...</Text>
        </Box>
      </Container>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <Container>
        <Box>
          <Text color="red">{error}</Text>
          <Button onClick={() => router.push('/expenses')} mt="3">
            목록으로 돌아가기
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container>
      {/* 헤더 */}
      <Flex justify="between" align="center" mb="6">
        <Text size="6" weight="bold">
          {title}
        </Text>
        {isEditMode && onDelete && (
          <Button variant="soft" color="red" onClick={onDelete} disabled={deleting}>
            {deleting ? '삭제 중...' : '삭제'}
          </Button>
        )}
      </Flex>

      {/* 폼 */}
      <ExpenseForm
        title={isEditMode ? '지출내역 수정' : '지출내역 등록'}
        subtitle={
          subtitle || (isEditMode ? '지출 정보를 수정해주세요.' : '지출 정보를 입력해주세요.')
        }
        submitButtonText={submitButtonText}
        initialData={initialData}
        onSubmit={onSubmit}
        onCancel={onCancel}
        loading={loading}
        showImageUpload={showImageUpload}
      />

      {/* 수정 페이지에서만 영수증 이미지 표시 */}
      {isEditMode && expense?.receiptImage && (
        <Box className="mt-8">
          <Text weight="bold" size="3" color="gray" mb="4">
            기존 영수증 이미지
          </Text>
          <Box className="border rounded-lg overflow-hidden">
            <Image
              src={urlFor(expense.receiptImage).url()}
              alt="영수증"
              width={800}
              height={600}
              style={{
                width: '100%',
                height: 'auto',
                objectFit: 'contain',
                maxHeight: 'none',
              }}
            />
          </Box>
        </Box>
      )}
    </Container>
  );
}
