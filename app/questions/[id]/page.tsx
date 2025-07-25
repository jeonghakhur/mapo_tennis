'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Box, Text, Button, Flex } from '@radix-ui/themes';
import Link from 'next/link';
// import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';
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

export default function QuestionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { status } = useSession();
  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/signin');
      return;
    }
    if (status === 'authenticated' && params?.id) {
      fetch(`/api/questions/${params.id}`)
        .then((res) => res.json())
        .then((data) => {
          setQuestion(data.question || null);
        })
        .finally(() => setLoading(false));
    }
  }, [status, params, router]);

  if (loading) return <Text>로딩 중...</Text>;
  if (!question) return <Text>문의 정보를 불러올 수 없습니다.</Text>;

  return (
    <Box maxWidth="600px" mx="auto" mt="6">
      <Button asChild size="2" variant="soft" mb="4">
        <Link href="/questions">← 목록으로</Link>
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
    </Box>
  );
}
