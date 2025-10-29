'use client';
import { useRouter } from 'next/navigation';
import React from 'react';
import { useState } from 'react';
import ExpensePageLayout from '@/components/ExpensePageLayout';
import { useExpense } from '@/hooks/useExpenses';
import { useExpenses } from '@/hooks/useExpenses';

export default function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const { expense, loading, error } = useExpense(id);
  const { updateExpense, deleteExpense, loading: saving } = useExpenses({ autoFetch: false });
  const [deleting, setDeleting] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    try {
      await updateExpense(id, formData);
      alert('지출내역이 수정되었습니다.');
      router.push(`/expenses/${id}`);
    } catch (error) {
      console.error('지출내역 수정 실패:', error);
    }
  };

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
    } finally {
      setDeleting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/expenses/${id}`);
  };

  return (
    <ExpensePageLayout
      title="지출내역 수정"
      subtitle="지출 정보를 수정해주세요."
      submitButtonText="지출내역 수정"
      initialData={{
        title: expense?.title || '',
        storeName: expense?.storeName || '',
        address: expense?.address || '',
        amount: expense ? String(expense.amount) : '',
        expenseType: expense?.expenseType || '',
        category: expense?.category || '',
        date: expense?.date || '',
        description: expense?.description || '',
      }}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      loading={saving}
      showImageUpload={true}
      isEditMode={true}
      expense={expense}
      onDelete={handleDelete}
      deleting={deleting}
      isLoading={loading}
      error={error}
    />
  );
}
