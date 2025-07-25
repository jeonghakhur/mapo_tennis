import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Box, Text } from '@radix-ui/themes';

interface QuestionListItem {
  _id: string;
  title: string;
  createdAt: string;
  answer?: string;
  author?: { name?: string };
}

export default function AdminQuestionListPage() {
  const router = useRouter();
  const { status, data } = useSession();
  const [questions, setQuestions] = useState<QuestionListItem[]>([]);
  const [loading, setLoading] = useState(true);

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
    if (status === 'authenticated') {
      fetch('/api/questions/admin')
        .then((res) => res.json())
        .then((data) => {
          setQuestions(data.questions || []);
        })
        .finally(() => setLoading(false));
    }
  }, [status, data, router]);

  return (
    <Box maxWidth="700px" mx="auto" mt="6">
      <Text size="5" weight="bold" mb="4">
        전체 1:1 문의 목록
      </Text>
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
                {q.author?.name && (
                  <Text size="2" color="gray" ml="3">
                    작성자: {q.author.name}
                  </Text>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Box>
  );
}
