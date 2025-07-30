import { client } from '@/sanity/lib/client';
import type { Question, QuestionInput } from '@/model/question';
import { getUserById } from './user';
import { getUsersLevel4AndAbove } from './user';
import { createNotification, createNotificationMessage } from './notification';
import { createNotificationLink } from '@/lib/notificationUtils';

// 문의 생성
export async function createQuestion(data: QuestionInput): Promise<Question> {
  const now = new Date().toISOString();
  const created = await client.create({
    _type: 'question',
    ...data,
    createdAt: now,
  });
  // Sanity 반환값을 Question 타입으로 변환
  const question = created as unknown as Question;
  await notifyAdminsOnQuestionCreate(question);
  return question;
}

// 문의 작성 시 레벨 4 이상 회원에게 알림 생성
export async function notifyAdminsOnQuestionCreate(question: Question) {
  try {
    const admins = await getUsersLevel4AndAbove();
    const { title, message } = createNotificationMessage('CREATE', 'QUESTION', question.title);
    const link = createNotificationLink('QUESTION', question._id, { admin: true });

    await Promise.all(
      admins.map((admin) =>
        createNotification({
          type: 'CREATE',
          entityType: 'QUESTION',
          entityId: question._id,
          title,
          message,
          link,
          userId: admin._id,
        }),
      ),
    );
  } catch (e) {
    console.error('문의 알림 생성 오류:', e);
  }
}

// 본인 문의 목록 조회
export async function getMyQuestions(userId: string): Promise<Question[]> {
  const query = `*[_type == "question" && author._ref == $userId] {
    _id,
    _createdAt,
    title,
    content,
    answer,
    author->{
      _id,
      name,
      email,
      gender,
      age,
      club->{
        _id,
        name,
        location
      }
    }
  } | order(_createdAt desc)`;
  return await client.fetch(query, { userId });
}

// 전체 문의 목록(관리자)
export async function getAllQuestions(): Promise<Question[]> {
  const query = `*[_type == "question"] | order(_createdAt desc)`;
  return await client.fetch(query);
}

// 문의 상세 조회 (본인/관리자)
export async function getQuestionById(id: string): Promise<Question | null> {
  const query = `*[_type == "question" && _id == $id][0]{
    ...,
    author->{
      _id, 
      name, 
    },
    answeredBy->{_id, name},
    answeredAt
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
  await client
    .patch(questionId)
    .set({ answer, answeredBy: { _type: 'reference', _ref: answeredById }, answeredAt: now })
    .commit();
  // patch 후 최신 question을 조회해 author, title 등 모든 필드 보장
  const question = await getQuestionById(questionId);
  if (question) {
    await notifyUserOnAnswer(question);
    return question;
  }
  throw new Error('답변 후 문의를 찾을 수 없습니다.');
}

// 답변 등록 시 작성자에게 알림 생성
export async function notifyUserOnAnswer(question: Question) {
  try {
    // author가 string(유저 id) 또는 {_id, name} 객체일 수 있음
    let authorId: string | undefined;
    if (typeof question.author === 'string') {
      authorId = question.author;
    } else if (question.author && typeof question.author === 'object' && '_id' in question.author) {
      authorId = question.author._id;
    }
    if (!authorId) return;
    const { title, message } = createNotificationMessage('UPDATE', 'QUESTION', question.title);
    const link = createNotificationLink('QUESTION', question._id);
    await createNotification({
      type: 'UPDATE',
      entityType: 'QUESTION',
      entityId: question._id,
      title,
      message,
      link,
      userId: authorId,
    });
  } catch (e) {
    console.error('문의 답변 알림 생성 오류:', e);
  }
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
