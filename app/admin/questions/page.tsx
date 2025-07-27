'use client';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Text } from '@radix-ui/themes';
import { useQuestionsList } from '@/hooks/useQuestions';
import Container from '@/components/Container';

export default function AdminQuestionListPage() {
  const router = useRouter();
  const { status, data } = useSession();
  const { questions, isLoading, isError } = useQuestionsList(true);

  if (status === 'unauthenticated') {
    router.replace('/auth/signin');
    return null;
  }
  if (status === 'authenticated' && data?.user?.level < 4) {
    router.replace('/');
    return null;
  }

  return (
    <Container>
      {isLoading ? (
        <Text>로딩 중...</Text>
      ) : isError ? (
        <Text>오류가 발생했습니다.</Text>
      ) : questions.length === 0 ? (
        <Text>등록된 문의가 없습니다.</Text>
      ) : (
        <ul className="space-y-3" style={{ padding: 0, listStyle: 'none' }}>
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
                onClick={() => router.push(`/admin/questions/${q._id}`)}
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
                {typeof q.author === 'object' && q.author?.name && (
                  <Text size="2" color="gray" ml="3">
                    작성자: {q.author.name}
                  </Text>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
