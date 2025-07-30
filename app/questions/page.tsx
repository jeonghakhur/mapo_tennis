'use client';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button, Flex, Separator, Text, Badge } from '@radix-ui/themes';
import Link from 'next/link';
import Container from '@/components/Container';
import { useQuestionsList } from '@/hooks/useQuestions';
import SkeletonCard from '@/components/SkeletonCard';
import { useState, useEffect } from 'react';

export default function QuestionListPage() {
  const router = useRouter();
  const { status } = useSession();
  const { questions, isLoading, isError } = useQuestionsList();
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  // 첫 번째 문의가 있으면 기본적으로 확장
  useEffect(() => {
    if (questions.length > 0) {
      setExpandedQuestions(new Set([questions[0]._id]));
    }
  }, [questions]);

  if (status === 'unauthenticated') {
    if (typeof window !== 'undefined') router.replace('/auth/signin');
    return null;
  }

  // HTML을 안전하게 렌더링하는 함수
  const renderHtml = (htmlContent: string) => {
    return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
  };

  // 문의 토글 핸들러
  const handleQuestionToggle = (questionId: string) => {
    setExpandedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  // 삭제 핸들러 예시 (상세에서만 사용 가능, 목록에서는 필요시 구현)
  // const handleDelete = async (id: string) => {
  //   await deleteQuestion(id, '/api/questions');
  // };

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
      {isLoading ? (
        <SkeletonCard />
      ) : isError ? (
        <Text>오류가 발생했습니다.</Text>
      ) : questions.length === 0 ? (
        <Text>등록된 문의가 없습니다.</Text>
      ) : (
        <ul className="space-y-3" style={{ marginTop: '1rem', padding: 0, listStyle: 'none' }}>
          {questions.map((q) => {
            const isExpanded = expandedQuestions.has(q._id);

            return (
              <li key={q._id}>
                <div
                  style={{
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid #eee',
                    background: 'white',
                  }}
                >
                  <Flex align="center" justify="between" mb="3">
                    <Flex align="center" gap="3">
                      <Badge color={q.answer ? 'green' : 'red'}>
                        {q.answer ? '답변 완료' : '미답변'}
                      </Badge>
                      <Text
                        size="4"
                        weight="bold"
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleQuestionToggle(q._id)}
                      >
                        {q.title}
                      </Text>
                    </Flex>
                    <Text size="2" color="gray">
                      {new Date(q._createdAt).toLocaleDateString()}
                    </Text>
                  </Flex>

                  {/* 상세 내용 - 토글 가능 */}
                  {isExpanded && (
                    <>
                      <Separator size="4" mb="3" />

                      {/* 문의 내용 */}
                      <div className="mb-4">
                        <Text size="3" weight="bold" mb="2" as="div">
                          문의 내용
                        </Text>
                        <div style={{ color: '#666', fontSize: '14px' }}>
                          {renderHtml(q.content)}
                        </div>
                      </div>

                      {/* 답변 내용 */}
                      {q.answer && (
                        <div className="mb-4">
                          <Text size="3" weight="bold" mb="2" as="div">
                            답변
                          </Text>
                          <div style={{ color: '#666', fontSize: '14px' }}>
                            {renderHtml(q.answer)}
                          </div>
                        </div>
                      )}

                      {/* 수정 버튼 */}
                      <Flex justify="end" mt="3">
                        {!q.answer && (
                          <Button
                            size="2"
                            variant="soft"
                            onClick={() => router.push(`/questions/${q._id}/edit`)}
                          >
                            수정
                          </Button>
                        )}
                      </Flex>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Container>
  );
}
