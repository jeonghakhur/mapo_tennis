'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button, Text } from '@radix-ui/themes';
import Link from 'next/link';
import Container from '@/components/Container';

interface QuestionListItem {
  _id: string;
  title: string;
  createdAt: string;
  answer?: string;
}

export default function QuestionListPage() {
  const router = useRouter();
  const { status } = useSession();
  const [questions, setQuestions] = useState<QuestionListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/signin');
      return;
    }
    if (status === 'authenticated') {
      fetch('/api/questions')
        .then((res) => res.json())
        .then((data) => {
          setQuestions(data.questions || []);
        })
        .finally(() => setLoading(false));
    }
  }, [status, router]);

  return (
    <Container>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}
      >
        <Text size="5" weight="bold">
          1:1 문의 내역
        </Text>
        <Button asChild size="3" variant="solid">
          <Link href="/questions/create">문의 작성</Link>
        </Button>
      </div>
      {loading ? (
        <Text>로딩 중...</Text>
      ) : questions.length === 0 ? (
        <Text>등록된 문의가 없습니다.</Text>
      ) : (
        <ul className="space-y-3" style={{ marginTop: '1rem', padding: 0, listStyle: 'none' }}>
          {questions.map((q) => (
            <li key={q._id}>
              <div
                style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid #eee',
                  background: 'white',
                  cursor: 'pointer',
                }}
                onClick={() => router.push(`/questions/${q._id}`)}
              >
                <Text size="4" weight="bold">
                  {q.title}
                </Text>
                <Text size="2" color="gray" ml="3">
                  {new Date(q.createdAt).toLocaleDateString()}
                </Text>
                <Text size="2" color={q.answer ? 'green' : 'red'} ml="3">
                  {q.answer ? '답변 완료' : '미답변'}
                </Text>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
