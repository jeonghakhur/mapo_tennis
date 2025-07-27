'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import QuestionForm, { QuestionFormValues } from '@/components/QuestionForm';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useSession } from 'next-auth/react';
import Container from '@/components/Container';
import { useCreateQuestion } from '@/hooks/useQuestions';

export default function QuestionCreatePage() {
  const router = useRouter();
  const { status } = useSession();
  const [dialog, setDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    color: 'green' | 'red';
  }>({ open: false, title: '', description: '', color: 'green' });
  const { create, isMutating } = useCreateQuestion();
  const { data: session } = useSession();
  // 로그인 체크
  if (status === 'unauthenticated') {
    if (typeof window !== 'undefined') router.replace('/auth/signin');
    return null;
  }

  const handleSubmit = async (data: QuestionFormValues) => {
    try {
      await create(
        {
          ...data,
          author: { _ref: session?.user?._id },
        },
        '/api/questions',
      );
      setDialog({
        open: true,
        title: '등록 완료',
        description: '문의가 성공적으로 등록되었습니다.',
        color: 'green',
      });
    } catch (e: unknown) {
      let message = '';
      if (
        typeof e === 'object' &&
        e &&
        'message' in e &&
        typeof (e as { message?: unknown }).message === 'string'
      ) {
        message = (e as { message: string }).message;
      }
      if (message && message.includes('validation')) {
        setDialog({
          open: true,
          title: '입력 오류',
          description: message,
          color: 'red',
        });
      } else {
        setDialog({
          open: true,
          title: '오류 발생',
          description: '문의 등록 중 오류가 발생했습니다.',
          color: 'red',
        });
      }
    }
  };

  const handleError = (errors: Record<string, { message?: string }>) => {
    const messages = Object.values(errors)
      .map((e) => e.message)
      .filter(Boolean)
      .join('\n');
    setDialog({
      open: true,
      title: '입력 오류',
      description: messages || '필수 입력값을 확인해 주세요.',
      color: 'red',
    });
  };

  return (
    <Container>
      <QuestionForm onSubmit={handleSubmit} onError={handleError} isSubmitting={isMutating} />
      <ConfirmDialog
        title={dialog.title}
        description={dialog.description}
        confirmText="확인"
        confirmColor={dialog.color}
        open={dialog.open}
        onOpenChange={(open: boolean) => {
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
