'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Box, Text, Button, Flex, Separator, Grid } from '@radix-ui/themes';
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';
import ConfirmDialog from '@/components/ConfirmDialog';
import Image from 'next/image';
import { useQuestionDetail, useAnswerQuestion, useDeleteQuestion } from '@/hooks/useQuestions';
import Container from '@/components/Container';
import { useUserById } from '@/hooks/useUser';

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
    console.log(question);
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
  // const canDelete = data?.user && data.user.level >= 4;

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

  // 작성자 정보 컴포넌트
  const AuthorInfo = ({ authorId }: { authorId: string }) => {
    const { user: author } = useUserById(authorId);
    console.log(author);
    if (!author) return null;

    // 나이 계산
    const calculateAge = (birth: string) => {
      const birthDate = new Date(birth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    };

    return (
      <div
        style={{
          marginBottom: '1rem',
          padding: '0.5rem',
          background: '#f8f9fa',
          borderRadius: '4px',
        }}
      >
        <Text color="gray" mb="1" as="div" weight="bold">
          작성자 정보
        </Text>
        <Grid columns="2" gap="3">
          <Text color="gray">이름: {author.name}</Text>
          <Text color="gray">이메일: {author.email}</Text>
          <Text color="gray">성별: {author.gender}</Text>
          <Text color="gray">나이: {author.birth ? calculateAge(author.birth) : 'N/A'}세</Text>
          {author.clubs && author.clubs.length > 0 && (
            <Text color="gray">
              클럽: {author.clubs.map((club) => club.name || 'N/A').join(', ')}
            </Text>
          )}
        </Grid>
      </div>
    );
  };

  return (
    <Container>
      {/* 작성자 정보 */}
      {typeof question.author === 'object' && <AuthorInfo authorId={question.author._id} />}
      <Flex justify="between" align="center">
        <Text size="5" weight="bold" mb="2">
          {question.title}
        </Text>
        <Text size="2" color="gray" mb="2">
          {new Date(question._createdAt).toLocaleDateString()}
        </Text>
      </Flex>
      <Separator size="4" mb="3" />
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

      <SimpleEditor value={answer} onChange={setAnswer} minHeight="120px" maxHeight="300px" />
      <Box className="btn-wrap mt-4">
        <Button size="3" color="red" variant="soft" onClick={() => setShowDelete(true)}>
          삭제
        </Button>

        <Button size="3" onClick={handleSubmit} disabled={isSubmitting || isAnswering}>
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
