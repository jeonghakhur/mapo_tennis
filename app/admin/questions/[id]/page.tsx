import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Box, Text, Button, Flex } from '@radix-ui/themes';
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';
import ConfirmDialog from '@/components/ConfirmDialog';
import Image from 'next/image';

interface QuestionDetail {
  _id: string;
  title: string;
  content: string;
  attachments?: { filename: string; url: string }[];
  createdAt: string;
  answer?: string;
  answeredAt?: string;
}

export default function AdminQuestionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { status, data } = useSession();
  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialog, setDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    color: 'green' | 'red';
  }>({ open: false, title: '', description: '', color: 'green' });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/signin');
      return;
    }
    // 관리자만 접근 (level 5)
    if (status === 'authenticated' && data?.user?.level < 5) {
      router.replace('/');
      return;
    }
    if (status === 'authenticated' && params?.id) {
      fetch(`/api/questions/${params.id}`)
        .then((res) => res.json())
        .then((data) => {
          setQuestion(data.question || null);
          setAnswer(data.question?.answer || '');
        })
        .finally(() => setLoading(false));
    }
  }, [status, data, params, router]);

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
      const res = await fetch(`/api/questions/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer }),
      });
      if (res.ok) {
        setDialog({
          open: true,
          title: '등록 완료',
          description: '답변이 성공적으로 등록되었습니다.',
          color: 'green',
        });
      } else {
        const err = await res.json();
        setDialog({
          open: true,
          title: '오류 발생',
          description: err.error || '답변 등록 중 오류가 발생했습니다.',
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

  if (loading) return <Text>로딩 중...</Text>;
  if (!question) return <Text>문의 정보를 불러올 수 없습니다.</Text>;

  return (
    <Box maxWidth="700px" mx="auto" mt="6">
      <Button asChild size="2" variant="soft" mb="4">
        <span onClick={() => router.push('/admin/questions')}>← 목록으로</span>
      </Button>
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
      <Box mt="6" p="4">
        <Text size="4" weight="bold" color="green" mb="2">
          답변 작성
        </Text>
        <SimpleEditor value={answer} onChange={setAnswer} minHeight="120px" maxHeight="300px" />
        <Button size="3" mt="4" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? '등록 중...' : '답변 등록'}
        </Button>
      </Box>
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
    </Box>
  );
}
