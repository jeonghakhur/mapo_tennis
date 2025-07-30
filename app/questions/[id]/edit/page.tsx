'use client';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Text } from '@radix-ui/themes';
import Container from '@/components/Container';
import QuestionForm, { QuestionFormValues } from '@/components/QuestionForm';
import { useQuestionDetail, useUpdateQuestion } from '@/hooks/useQuestions';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function QuestionEditPage() {
  const router = useRouter();
  const params = useParams();
  const { status, data } = useSession();
  const { question, isLoading, isError } = useQuestionDetail(params?.id as string);
  const { update, isMutating } = useUpdateQuestion();
  const [dialog, setDialog] = useState({
    open: false,
    title: '',
    description: '',
    color: 'green' as 'green' | 'red',
  });
  const [forbiddenDialog, setForbiddenDialog] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/signin');
    }
  }, [status, router]);

  // 본인만 접근 가능
  useEffect(() => {
    if (
      status === 'authenticated' &&
      question &&
      (!data?.user || typeof question.author !== 'object' || question.author._id !== data.user.id)
    ) {
      setForbiddenDialog(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) return <Text>로딩 중...</Text>;
  if (isError || !question) return <Text>문의 정보를 불러올 수 없습니다.</Text>;

  const handleSubmit = async (form: QuestionFormValues) => {
    try {
      await update(
        question._id,
        {
          ...form,
          author: { _ref: data?.user?.id },
        },
        `/api/questions/${question._id}`,
      );
      setDialog({
        open: true,
        title: '수정 완료',
        description: '문의가 성공적으로 수정되었습니다.',
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
      setDialog({
        open: true,
        title: '오류 발생',
        description: message || '문의 수정 중 오류가 발생했습니다.',
        color: 'red',
      });
    }
  };

  return (
    <Container>
      <QuestionForm
        onSubmit={handleSubmit}
        isSubmitting={isMutating}
        defaultValues={{
          title: question.title,
          content: question.content,
          attachments: question.attachments || [],
        }}
      />
      <ConfirmDialog
        title={dialog.title}
        description={dialog.description}
        confirmText="확인"
        confirmColor={dialog.color}
        open={dialog.open}
        onOpenChange={(open) => {
          setDialog((d) => ({ ...d, open }));
          if (!open && dialog.color === 'green') router.push(`/questions/`);
        }}
        onConfirm={() => {
          setDialog((d) => ({ ...d, open: false }));
          if (dialog.color === 'green') router.push(`/questions/`);
        }}
      />
      <ConfirmDialog
        title="권한 없음"
        description="본인만 수정할 수 있습니다."
        confirmText="확인"
        confirmColor="red"
        open={forbiddenDialog}
        onOpenChange={setForbiddenDialog}
        onConfirm={() => {
          setForbiddenDialog(false);
          router.replace(`/questions/`);
        }}
      />
    </Container>
  );
}
