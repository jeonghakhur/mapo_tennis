'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import QuestionForm, { QuestionFormValues } from '@/components/QuestionForm';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useSession } from 'next-auth/react';
import Container from '@/components/Container';

export default function QuestionCreatePage() {
  const router = useRouter();
  const { status } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialog, setDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    color: 'green' | 'red';
  }>({ open: false, title: '', description: '', color: 'green' });

  // 로그인 체크
  if (status === 'unauthenticated') {
    if (typeof window !== 'undefined') router.replace('/auth/signin');
    return null;
  }

  const handleSubmit = async (data: QuestionFormValues) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setDialog({
          open: true,
          title: '등록 완료',
          description: '문의가 성공적으로 등록되었습니다.',
          color: 'green',
        });
      } else {
        const err = await res.json();
        setDialog({
          open: true,
          title: '오류 발생',
          description: err.error || '문의 등록 중 오류가 발생했습니다.',
          color: 'red',
        });
      }
    } catch {
      setDialog({
        open: true,
        title: '오류 발생',
        description: '네트워크 오류가 발생했습니다.',
        color: 'red',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container>
      <h1 style={{ fontWeight: 700, fontSize: '2rem', marginBottom: '1.5rem' }}>1:1 문의 작성</h1>
      <QuestionForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      <ConfirmDialog
        title={dialog.title}
        description={dialog.description}
        confirmText="확인"
        confirmColor={dialog.color}
        open={dialog.open}
        onOpenChange={(open) => {
          setDialog((d) => ({ ...d, open }));
          if (!open && dialog.color === 'green') router.push('/questions');
        }}
        onConfirm={() => {
          setDialog((d) => ({ ...d, open: false }));
          if (dialog.color === 'green') router.push('/questions');
        }}
      />
    </Container>
  );
}
