'use client';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button, Flex, Separator, Text, Badge } from '@radix-ui/themes';
import Link from 'next/link';
import Container from '@/components/Container';
import { useQuestionsList, useDeleteQuestion } from '@/hooks/useQuestions';
import SkeletonCard from '@/components/SkeletonCard';
import { useState, useEffect } from 'react';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function QuestionListPage() {
  const router = useRouter();
  const { status } = useSession();
  const { questions, isLoading, isError } = useQuestionsList();
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const { remove: deleteQuestion } = useDeleteQuestion();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<string>('');

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

  // 삭제 핸들러
  const handleDeleteClick = (questionId: string) => {
    setQuestionToDelete(questionId);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteQuestion(questionToDelete, '/api/questions');
      setShowDeleteDialog(false);
      setQuestionToDelete('');
    } catch (error) {
      console.error('문의 삭제 실패:', error);
      alert('문의 삭제 중 오류가 발생했습니다.');
    }
  };

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

                      {/* 수정/삭제 버튼 */}
                      <Flex justify="end" mt="3" gap="2">
                        {!q.answer && (
                          <>
                            <Button
                              size="2"
                              variant="soft"
                              onClick={() => router.push(`/questions/${q._id}/edit`)}
                            >
                              수정
                            </Button>
                            <Button
                              size="2"
                              variant="soft"
                              color="red"
                              onClick={() => handleDeleteClick(q._id)}
                            >
                              삭제
                            </Button>
                          </>
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

      {/* 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        title="문의 삭제 확인"
        description="정말로 이 문의를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmText="삭제"
        cancelText="취소"
        confirmColor="red"
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteConfirm}
      />
    </Container>
  );
}
