import { client } from '@/sanity/lib/client';
import type { Question, QuestionInput } from '@/model/question';
import { getUserById } from './user';

// 문의 생성
export async function createQuestion(data: QuestionInput): Promise<Question> {
  const now = new Date().toISOString();
  const created = await client.create({
    _type: 'question',
    ...data,
    createdAt: now,
  });
  // Sanity 반환값을 Question 타입으로 변환
  return created as unknown as Question;
}

// 본인 문의 목록 조회
export async function getMyQuestions(userId: string): Promise<Question[]> {
  const query = `*[_type == "question" && author._ref == $userId] | order(createdAt desc)`;
  return await client.fetch(query, { userId });
}

// 전체 문의 목록(관리자)
export async function getAllQuestions(): Promise<Question[]> {
  const query = `*[_type == "question"] | order(createdAt desc)`;
  return await client.fetch(query);
}

// 문의 상세 조회 (본인/관리자)
export async function getQuestionById(id: string): Promise<Question | null> {
  const query = `*[_type == "question" && _id == $id][0]{
    ...,
    author->{_id, name},
    answeredBy->{_id, name}
  }`;
  return await client.fetch(query, { id });
}

// 문의 수정 (작성자)
export async function updateQuestion(id: string, data: Partial<QuestionInput>): Promise<Question> {
  const patch: Partial<QuestionInput> = {};
  if (data.title !== undefined) patch.title = data.title;
  if (data.content !== undefined) patch.content = data.content;
  if (data.attachments !== undefined) patch.attachments = data.attachments;
  const updated = await client.patch(id).set(patch).commit();
  return updated as unknown as Question;
}

// 답변 등록/수정 (관리자)
export async function answerQuestion({
  questionId,
  answer,
  answeredById,
}: {
  questionId: string;
  answer: string;
  answeredById: string;
}): Promise<Question> {
  const now = new Date().toISOString();
  await getUserById(answeredById); // 존재 확인만
  const patched = await client
    .patch(questionId)
    .set({ answer, answeredBy: { _type: 'reference', _ref: answeredById }, answeredAt: now })
    .commit();
  return patched as unknown as Question;
}

// // 문의 작성 시 관리자 알림 생성 (구현 예정)
// export async function notifyAdminsOnQuestionCreate(_question: Question) {
//   // TODO: 관리자 목록 조회 후 반복 생성
// }

// // 답변 등록 시 작성자 알림 생성 (구현 예정)
// export async function notifyUserOnAnswer(_question: Question) {
//   // TODO: question.author에게 알림 생성
// }

// 문의 삭제 (작성자 또는 관리자)
export async function deleteQuestion(questionId: string): Promise<boolean> {
  await client.delete(questionId);
  return true;
}
