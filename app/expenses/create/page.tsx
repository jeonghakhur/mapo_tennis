'use client';
import { useRouter } from 'next/navigation';
import ExpensePageLayout from '@/components/ExpensePageLayout';
import { useExpenses } from '@/hooks/useExpenses';

export default function CreateExpensePage() {
  const router = useRouter();
  const { createExpense, loading } = useExpenses({ autoFetch: false });

  const handleSubmit = async (formData: FormData) => {
    try {
      await createExpense(formData);
      alert('지출내역이 저장되었습니다.');
      router.push('/expenses');
    } catch (error) {
      console.error('지출내역 생성 실패:', error);
    }
  };

  const handleCancel = () => {
    router.push('/expenses');
  };

  return (
    <ExpensePageLayout
      title="지출내역 등록"
      subtitle="지출 정보를 입력해주세요."
      submitButtonText="지출내역 등록"
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      loading={loading}
      showImageUpload={true}
      isEditMode={false}
    />
  );
}
