import useSWR, { mutate } from 'swr';
import useSWRMutation from 'swr/mutation';
import { useCallback } from 'react';
import type { Question, QuestionInput } from '@/model/question';

// 목록 조회
export function useQuestionsList(isAdmin: boolean = false) {
  const url = isAdmin ? '/api/questions/admin' : '/api/questions';
  const { data, error, isLoading, mutate: refresh } = useSWR<{ questions: Question[] }>(url);
  return {
    questions: data?.questions || [],
    isLoading,
    isError: !!error,
    refresh,
  };
}

// 상세 조회
export function useQuestionDetail(id?: string) {
  const {
    data,
    error,
    isLoading,
    mutate: refresh,
  } = useSWR<{ question: Question }>(id ? `/api/questions/${id}` : null);
  return {
    question: data?.question,
    isLoading,
    isError: !!error,
    refresh,
  };
}

// 문의 생성 (Optimistic Update)
export function useCreateQuestion() {
  const { trigger, isMutating } = useSWRMutation(
    '/api/questions',
    async (url, { arg }: { arg: QuestionInput }) => {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(arg),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  );

  const create = useCallback(
    async (data: QuestionInput, optimisticListKey: string) => {
      await mutate(
        optimisticListKey,
        async (current: { questions: Question[] } | undefined) => {
          const safeCurrent = current ?? { questions: [] };
          const result = await trigger(data);
          return {
            ...safeCurrent,
            questions: [result.question as Question, ...safeCurrent.questions],
          };
        },
        {
          optimisticData: (current: { questions: Question[] } | undefined) => {
            const safeCurrent = current ?? { questions: [] };
            return {
              ...safeCurrent,
              questions: [
                {
                  ...data,
                  _id: 'optimistic-' + Date.now(),
                  createdAt: new Date().toISOString(),
                  _type: 'question',
                  author:
                    typeof data.author === 'string'
                      ? data.author
                      : { _id: data.author._ref, name: '' },
                } as Question,
                ...safeCurrent.questions,
              ],
            };
          },
          rollbackOnError: true,
          revalidate: true,
        },
      );
    },
    [trigger],
  );

  return { create, isMutating };
}

// 문의 삭제 (Optimistic Update)
export function useDeleteQuestion() {
  const { trigger, isMutating } = useSWRMutation(
    '/api/questions/delete', // dummy key, 실제로는 arg로 id 전달
    async (url, { arg }: { arg: string }) => {
      const res = await fetch(`/api/questions/${arg}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  );

  const remove = useCallback(
    async (id: string, optimisticListKey: string) => {
      await mutate(
        optimisticListKey,
        async (current: { questions: Question[] } | undefined) => {
          const safeCurrent = current ?? { questions: [] };
          await trigger(id);
          return {
            ...safeCurrent,
            questions: safeCurrent.questions.filter((q) => q._id !== id),
          };
        },
        {
          optimisticData: (current: { questions: Question[] } | undefined) => {
            const safeCurrent = current ?? { questions: [] };
            return {
              ...safeCurrent,
              questions: safeCurrent.questions.filter((q) => q._id !== id),
            };
          },
          rollbackOnError: true,
          revalidate: true,
        },
      );
    },
    [trigger],
  );

  return { remove, isMutating };
}

// 문의 수정 (Optimistic Update)
export function useUpdateQuestion() {
  const { trigger, isMutating } = useSWRMutation(
    '/api/questions/update', // dummy key
    async (url, { arg }: { arg: { id: string; data: QuestionInput } }) => {
      const res = await fetch(`/api/questions/${arg.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(arg.data),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }
      return res.json();
    },
  );

  const update = useCallback(
    async (id: string, data: QuestionInput, optimisticDetailKey: string) => {
      await mutate(
        optimisticDetailKey,
        async (current: { question: Question } | undefined) => {
          const safeCurrent = current ?? { question: undefined };
          const result = await trigger({ id, data });
          return { ...safeCurrent, question: result.question as Question };
        },
        {
          optimisticData: (current: { question: Question } | undefined) => {
            const safeCurrent = current ?? { question: undefined };
            return {
              ...safeCurrent,
              question: {
                ...safeCurrent.question,
                ...data,
                author:
                  typeof data.author === 'string'
                    ? data.author
                    : { _id: data.author._ref, name: '' },
              } as Question,
            };
          },
          rollbackOnError: true,
          revalidate: true,
        },
      );
    },
    [trigger],
  );

  return { update, isMutating };
}

// 답변 등록/수정 (Optimistic Update)
export function useAnswerQuestion() {
  const { trigger, isMutating } = useSWRMutation(
    '/api/questions/answer', // dummy key, 실제로는 arg로 id/answer 전달
    async (url, { arg }: { arg: { id: string; answer: string } }) => {
      const res = await fetch(`/api/questions/${arg.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: arg.answer }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  );

  const answer = useCallback(
    async (id: string, answer: string, optimisticDetailKey: string) => {
      await mutate(
        optimisticDetailKey,
        async (current: { question: Question } | undefined) => {
          const safeCurrent = current ?? { question: undefined };
          const result = await trigger({ id, answer });
          return { ...safeCurrent, question: result.question as Question };
        },
        {
          optimisticData: (current: { question: Question } | undefined) => {
            const safeCurrent = current ?? { question: undefined };
            return {
              ...safeCurrent,
              question: { ...safeCurrent.question, answer } as Question,
            };
          },
          rollbackOnError: true,
          revalidate: true,
        },
      );
    },
    [trigger],
  );

  return { answer, isMutating };
}
