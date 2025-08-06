import { client } from '@/sanity/lib/client';
import type { Question, QuestionInput } from '@/model/question';
import { getUserById, removeExpiredKakaoToken } from './user';

import {
  createNotification,
  createNotificationMessage,
  createNotificationStatuses,
} from './notification';
import { createNotificationLink } from '@/lib/notificationUtils';
import {
  sendKakaoMessage,
  createQuestionNotificationMessage,
  createQuestionAnswerNotificationMessage,
  createQuestionNotificationTemplateMessage,
  createQuestionAnswerNotificationTemplateMessage,
} from '@/lib/kakaoUtils';

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
    const { title, message } = createNotificationMessage('CREATE', 'QUESTION', question.title);
    const link = createNotificationLink('QUESTION', question._id, { admin: true });

    const notification = await createNotification({
      type: 'CREATE',
      entityType: 'QUESTION',
      entityId: question._id,
      title,
      message,
      link,
      requiredLevel: 4, // 레벨 4 (경기관리자)만 알림 수신
    });

    // 레벨 4 이상 회원들에게 알림 상태 생성
    await createNotificationStatuses(notification._id, undefined, 4);

    // 카카오톡 메시지 전송 (관리자에게)
    await sendKakaoMessageToAdmins(question);
  } catch (e) {
    console.error('문의 알림 생성 오류:', e);
  }
}

// 레벨 5 이상 관리자들에게 카카오톡 메시지 전송
async function sendKakaoMessageToAdmins(question: Question) {
  try {
    // 레벨 4 이상 사용자 조회
    const adminUsersQuery = `*[_type == "user" && level >= 5] {
      _id,
      name,
      kakaoAccessToken
    }`;

    const adminUsers = await client.fetch(adminUsersQuery);

    // 문의 작성자 정보 조회
    let authorName = '알 수 없음';
    if (question.author && typeof question.author === 'object' && '_ref' in question.author) {
      const authorQuery = `*[_type == "user" && _id == $authorId][0] {
        name
      }`;
      const author = await client.fetch(authorQuery, { authorId: question.author._ref });
      console.log(author);
      if (author) {
        authorName = author.name || '알 수 없음';
      }
    }

    // 웹 URL 생성 (관리자 페이지)
    const webUrl = `${process.env.NEXTAUTH_URL}/admin/questions/${question._id}`;

    // 카카오톡 메시지 생성 (기본 템플릿 - 더 많은 내용)
    const message = createQuestionNotificationTemplateMessage(
      question.title,
      authorName,
      question.content, // 문의 내용 추가
      webUrl,
    );

    // 각 관리자에게 메시지 전송 (현재는 로그만 출력)
    for (const admin of adminUsers) {
      if (admin.kakaoAccessToken) {
        console.log(`카카오톡 메시지 전송 시도: ${admin.name}에게`);
        try {
          const success = await sendKakaoMessage(admin.kakaoAccessToken, message);
          if (success) {
            console.log(`카카오톡 메시지 전송 성공: ${admin.name}`);
          } else {
            console.log(`카카오톡 메시지 전송 실패: ${admin.name} (토큰 만료 가능성)`);
            // 토큰 만료 시 자동 제거
            await removeExpiredKakaoToken(admin._id);
          }
        } catch (error) {
          console.error(`카카오톡 메시지 전송 실패: ${admin.name}`, error);
          // 토큰 만료 시 자동 제거
          await removeExpiredKakaoToken(admin._id);
        }
      } else {
        console.log(`카카오 액세스 토큰 없음: ${admin.name}`);
      }
    }
  } catch (error) {
    console.error('카카오톡 메시지 전송 실패:', error);
  }
}

// 문의 작성자에게 카카오톡 메시지 전송
async function sendKakaoMessageToQuestionAuthor(question: Question) {
  try {
    // 문의 작성자 정보 조회
    let authorId: string | undefined;

    console.log('question.author 구조:', question.author);
    console.log('question.author 타입:', typeof question.author);

    if (typeof question.author === 'string') {
      authorId = question.author;
      console.log('문의 작성자 ID (string):', authorId);
    } else if (question.author && typeof question.author === 'object' && '_id' in question.author) {
      authorId = question.author._id as string;
      console.log('문의 작성자 ID (object with _id):', authorId);
    } else if (
      question.author &&
      typeof question.author === 'object' &&
      '_ref' in question.author
    ) {
      authorId = (question.author as { _ref: string })._ref;
      console.log('문의 작성자 ID (reference):', authorId);
    } else {
      console.log('문의 작성자 구조를 인식할 수 없음:', question.author);
    }

    if (!authorId) {
      console.log('문의 작성자 ID를 찾을 수 없음');
      return;
    }

    // 문의 작성자 상세 정보 조회 (카카오 액세스 토큰 포함)
    const authorQuery = `*[_type == "user" && _id == $authorId][0] {
      _id,
      name,
      kakaoAccessToken
    }`;

    const author = await client.fetch(authorQuery, { authorId });

    if (!author || !author.kakaoAccessToken) {
      console.log(`카카오 액세스 토큰 없음: ${author?.name || '알 수 없음'}`);
      return;
    }

    // 답변 작성자 정보 조회
    let answeredByName = '관리자';
    if (
      question.answeredBy &&
      typeof question.answeredBy === 'object' &&
      '_ref' in question.answeredBy
    ) {
      const answeredByQuery = `*[_type == "user" && _id == $answeredById][0] {
        name
      }`;
      const answeredBy = await client.fetch(answeredByQuery, {
        answeredById: question.answeredBy._ref,
      });
      if (answeredBy) {
        answeredByName = answeredBy.name || '관리자';
      }
    }

    // 웹 URL 생성 (문의 상세 페이지)
    const webUrl = `${process.env.NEXTAUTH_URL}/questions/${question._id}`;

    // 카카오톡 메시지 생성 (기본 템플릿 - 더 많은 내용)
    const message = createQuestionAnswerNotificationTemplateMessage(
      question.title,
      answeredByName,
      question.content, // 문의 내용 추가
      question.answer, // 답변 내용 추가
      webUrl,
    );

    // 문의 작성자에게 메시지 전송
    console.log(`카카오톡 메시지 전송 시도: ${author.name}에게`);
    try {
      const success = await sendKakaoMessage(author.kakaoAccessToken, message);
      if (success) {
        console.log(`카카오톡 메시지 전송 성공: ${author.name}`);
      } else {
        console.log(`카카오톡 메시지 전송 실패: ${author.name} (토큰 만료 가능성)`);
        // 토큰 만료 시 자동 제거
        await removeExpiredKakaoToken(author._id);
      }
    } catch (error) {
      console.error(`카카오톡 메시지 전송 실패: ${author.name}`, error);
      // 토큰 만료 시 자동 제거
      await removeExpiredKakaoToken(author._id);
    }
  } catch (error) {
    console.error('문의 작성자 카카오톡 메시지 전송 실패:', error);
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
    const notification = await createNotification({
      type: 'UPDATE',
      entityType: 'QUESTION',
      entityId: question._id,
      title,
      message,
      link,
      requiredLevel: 1, // 개인 알림이므로 레벨 1 이상
    });

    // 새로운 notificationStatus 구조에 맞게 알림 상태 생성
    // 문의 작성자에게만 알림을 보내기 위해 targetUserIds 사용
    await createNotificationStatuses(notification._id, [authorId]);

    // 카카오톡 메시지 전송 (문의 작성자에게)
    await sendKakaoMessageToQuestionAuthor(question);
  } catch (e) {
    console.error('문의 답변 알림 생성 오류:', e);
  }
}

// 문의 삭제 (작성자 또는 관리자)
export async function deleteQuestion(questionId: string): Promise<boolean> {
  await client.delete(questionId);
  return true;
}
