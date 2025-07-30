'use client';
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Box, Text, Button, Flex } from '@radix-ui/themes';
import Image from 'next/image';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useQuestionDetail, useDeleteQuestion } from '@/hooks/useQuestions';
import Container from '@/components/Container';

export default function QuestionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { status, data } = useSession();
  const { question, isLoading, isError } = useQuestionDetail(params?.id as string);
  const { remove: deleteQuestion } = useDeleteQuestion();
  const [showDelete, setShowDelete] = useState(false);
  const [dialog, setDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    color: 'green' | 'red';
  }>({ open: false, title: '', description: '', color: 'green' });

  if (status === 'unauthenticated') {
    if (typeof window !== 'undefined') router.replace('/auth/signin');
    return null;
  }

  if (isLoading) return <Text>로딩 중...</Text>;
  if (isError || !question) return <Text>문의 정보를 불러올 수 없습니다.</Text>;

  // 삭제 권한: 작성자 또는 레벨 4 이상
  const isOwner =
    data?.user && typeof question.author === 'object' && question.author._id === data.user.id;
  const canDelete = isOwner || (data?.user && data.user.level >= 4);

  const handleDelete = async () => {
    try {
      await deleteQuestion(question._id, '/api/questions');
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
      <Flex justify="end" gap="2" align="center" mb="4">
        {isOwner && !question.answer && (
          <Button
            size="3"
            variant="soft"
            color="blue"
            onClick={() => router.push(`/questions/${question._id}/edit`)}
          >
            수정
          </Button>
        )}
        {canDelete && !question.answer && (
          <Button size="3" color="red" variant="soft" onClick={() => setShowDelete(true)}>
            삭제
          </Button>
        )}
      </Flex>
      <Text size="5" weight="bold" mb="2">
        {question.title}
      </Text>
      <Text size="2" color="gray" mb="2">
        {new Date(question._createdAt).toLocaleDateString()}
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
      <Box mt="6" p="4">
        <Text size="4" weight="bold" color={question.answer ? 'green' : 'red'}>
          {question.answer ? '답변' : '아직 답변이 등록되지 않았습니다.'}
        </Text>
        {question.answer && (
          <Box mt="2">
            <div dangerouslySetInnerHTML={{ __html: question.answer }} />
            {question.answeredAt && (
              <Text size="1" color="gray" mt="2">
                답변일: {new Date(question.answeredAt).toLocaleDateString()}
              </Text>
            )}
          </Box>
        )}
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
