'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Box, Text, Button, Flex } from '@radix-ui/themes';
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';
import ConfirmDialog from '@/components/ConfirmDialog';
import Image from 'next/image';
import { useQuestionDetail, useAnswerQuestion, useDeleteQuestion } from '@/hooks/useQuestions';
import Container from '@/components/Container';

export default function AdminQuestionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { status, data } = useSession();
  const { question, isLoading, isError } = useQuestionDetail(params?.id as string);
  const { answer: answerQuestion, isMutating: isAnswering } = useAnswerQuestion();
  const { remove: deleteQuestion } = useDeleteQuestion();
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [dialog, setDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    color: 'green' | 'red';
  }>({ open: false, title: '', description: '', color: 'green' });

  useEffect(() => {
    if (question && question.answer) setAnswer(question.answer);
  }, [question]);

  if (status === 'unauthenticated') {
    router.replace('/auth/signin');
    return null;
  }
  if (status === 'authenticated' && data?.user?.level < 4) {
    router.replace('/');
    return null;
  }
  if (isLoading) return <Text>로딩 중...</Text>;
  if (isError || !question) return <Text>문의 정보를 불러올 수 없습니다.</Text>;

  // 삭제 권한: 레벨 4 이상만
  const canDelete = data?.user && data.user.level >= 4;

  const handleSubmit = async () => {
    if (!answer) {
      setDialog({
        open: true,
        title: '오류 발생',
        description: '답변 내용을 입력해 주세요.',
        color: 'red',
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await answerQuestion(question._id, answer, `/api/questions/${question._id}`);
      setDialog({
        open: true,
        title: '등록 완료',
        description: '답변이 성공적으로 등록되었습니다.',
        color: 'green',
      });
    } catch {
      setDialog({
        open: true,
        title: '오류 발생',
        description: '답변 등록 중 오류가 발생했습니다.',
        color: 'red',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteQuestion(question._id, '/api/questions/admin');
      setDialog({
        open: true,
        title: '삭제 완료',
        description: '문의가 삭제되었습니다.',
        color: 'green',
      });
    } catch {
      setDialog({
        open: true,
        title: '오류 발생',
        description: '삭제 중 오류가 발생했습니다.',
        color: 'red',
      });
    }
  };

  return (
    <Container>
      <Flex justify="end" align="center" mb="4">
        {canDelete && (
          <Button size="3" color="red" variant="soft" onClick={() => setShowDelete(true)}>
            삭제
          </Button>
        )}
      </Flex>
      <Text size="5" weight="bold" mb="2">
        {question.title}
      </Text>
      <Text size="2" color="gray" mb="2">
        {new Date(question.createdAt).toLocaleDateString()}
      </Text>
      <Box mb="4" mt="2">
        <div dangerouslySetInnerHTML={{ __html: question.content }} />
      </Box>
      {question.attachments && question.attachments.length > 0 && (
        <Box mb="4">
          <Text size="2" weight="bold">
            첨부 이미지
          </Text>
          <Flex mt="2" gap="3">
            {question.attachments.map((file, idx) => (
              <a key={idx} href={file.url} target="_blank" rel="noopener noreferrer">
                <Image src={file.url} alt={file.filename} width={120} height={120} />
              </a>
            ))}
          </Flex>
        </Box>
      )}
      <Box mt="6" p="4" style={{ borderRadius: 8, background: '#f8fafc' }}>
        <Text size="4" weight="bold" color="green" mb="2">
          답변 작성
        </Text>
        <SimpleEditor value={answer} onChange={setAnswer} minHeight="120px" maxHeight="300px" />
        <Button size="3" mt="4" onClick={handleSubmit} disabled={isSubmitting || isAnswering}>
          {isSubmitting || isAnswering ? '등록 중...' : '답변 등록'}
        </Button>
      </Box>
      <ConfirmDialog
        title="삭제 확인"
        description="정말로 이 문의를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmText="삭제"
        cancelText="취소"
        confirmColor="red"
        open={showDelete}
        onOpenChange={setShowDelete}
        onConfirm={handleDelete}
      />
      <ConfirmDialog
        title={dialog.title}
        description={dialog.description}
        confirmText="확인"
        confirmColor={dialog.color}
        open={dialog.open}
        onOpenChange={(open) => {
          setDialog((d) => ({ ...d, open }));
          if (!open && dialog.color === 'green') router.push('/admin/questions');
        }}
        onConfirm={() => {
          setDialog((d) => ({ ...d, open: false }));
          if (dialog.color === 'green') router.push('/admin/questions');
        }}
      />
    </Container>
  );
}
