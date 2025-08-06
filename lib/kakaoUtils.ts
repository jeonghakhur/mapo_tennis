// 카카오톡 메시지 전송 유틸리티

interface KakaoMessage {
  object_type: 'text' | 'feed' | 'list' | 'location' | 'commerce' | 'template';
  text?: string;
  link?: {
    web_url?: string;
    mobile_web_url?: string;
  };
  button_title?: string;
}

interface KakaoTextMessage extends KakaoMessage {
  object_type: 'text';
  text: string;
}

interface KakaoFeedMessage extends KakaoMessage {
  object_type: 'feed';
  content: {
    title: string;
    description: string;
    image_url?: string;
    link: {
      web_url?: string;
      mobile_web_url?: string;
    };
  };
  item_content?: {
    profile_text?: string;
    profile_image_url?: string;
    title_image_url?: string;
    title_image_text?: string;
    title_image_category?: string;
    items?: Array<{
      item: string;
      item_op: string;
    }>;
    sum?: string;
    sum_op?: string;
  };
  social?: {
    like_count?: number;
    comment_count?: number;
    shared_count?: number;
  };
  buttons?: Array<{
    title: string;
    link: {
      web_url?: string;
      mobile_web_url?: string;
    };
  }>;
}

// 카카오톡 기본 템플릿 메시지 (더 많은 내용 가능)
type KakaoTemplateMessage = KakaoTextMessage;

// 카카오톡 텍스트 메시지 생성
export function createKakaoTextMessage(text: string, webUrl?: string): KakaoTextMessage {
  return {
    object_type: 'text',
    text,
    link: webUrl ? { web_url: webUrl, mobile_web_url: webUrl } : undefined,
  };
}

// 카카오톡 피드 메시지 생성 (올바른 구조)
export function createKakaoFeedMessage(
  title: string,
  description: string,
  webUrl?: string,
  imageUrl?: string,
): KakaoFeedMessage {
  const message: KakaoFeedMessage = {
    object_type: 'feed',
    content: {
      title,
      description,
      image_url: imageUrl,
      link: webUrl ? { web_url: webUrl, mobile_web_url: webUrl } : {},
    },
  };

  // 버튼이 있는 경우에만 추가
  if (webUrl) {
    message.buttons = [
      {
        title: '자세히 보기',
        link: { web_url: webUrl, mobile_web_url: webUrl },
      },
    ];
  }

  return message;
}

// 카카오톡 기본 템플릿 메시지 생성 (더 많은 내용 가능)
export function createKakaoTemplateMessage(text: string, webUrl?: string): KakaoTemplateMessage {
  return {
    object_type: 'text',
    text,
    link: webUrl ? { web_url: webUrl, mobile_web_url: webUrl } : undefined,
  };
}

// 카카오톡 메시지 전송 (나에게 보내기)
export async function sendKakaoMessage(
  accessToken: string,
  message: KakaoTextMessage | KakaoFeedMessage | KakaoTemplateMessage,
): Promise<boolean> {
  try {
    // 메시지 객체 검증 및 디버깅
    console.log('전송할 메시지 객체:', message);
    const messageJson = JSON.stringify(message);
    console.log('JSON 변환된 메시지:', messageJson);

    const response = await fetch('https://kapi.kakao.com/v2/api/talk/memo/default/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        template_object: messageJson,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('카카오톡 메시지 전송 실패:', errorData);

      // 토큰 만료 오류 처리
      if (errorData.code === -401) {
        console.error('카카오 액세스 토큰이 만료되었습니다. 재로그인이 필요합니다.');
        return false;
      }

      // 파싱 오류 처리
      if (errorData.code === -2) {
        console.error('메시지 파싱 오류. 메시지 형식을 확인하세요.');
        return false;
      }

      return false;
    }

    const result = await response.json();
    console.log('카카오톡 메시지 전송 성공:', result);
    return true;
  } catch (error) {
    console.error('카카오톡 메시지 전송 중 오류:', error);
    return false;
  }
}

// HTML 태그 제거 함수
function removeHtmlTags(text: string): string {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

// 문의 등록 알림 메시지 생성 (텍스트 - 더 많은 내용)
export function createQuestionNotificationTemplateMessage(
  questionTitle: string,
  authorName: string,
  questionContent?: string,
  webUrl?: string,
): KakaoTextMessage {
  // HTML 태그 제거 및 내용 요약 (최대 500자)
  const cleanContent = questionContent ? removeHtmlTags(questionContent) : '';
  const contentPreview = cleanContent
    ? cleanContent.length > 500
      ? cleanContent.substring(0, 500) + '...'
      : cleanContent
    : '내용 없음';

  const message = `📝 새로운 문의가 등록되었습니다

제목: ${questionTitle}
작성자: ${authorName}

내용:
${contentPreview}

관리자 페이지에서 확인하세요.`;

  return createKakaoTextMessage(message, webUrl);
}

// 문의 답변 알림 메시지 생성 (텍스트 - 더 많은 내용)
export function createQuestionAnswerNotificationTemplateMessage(
  questionTitle: string,
  answeredByName: string,
  questionContent?: string,
  answerContent?: string,
  webUrl?: string,
): KakaoTextMessage {
  // HTML 태그 제거 및 내용 요약
  const cleanQuestionContent = questionContent ? removeHtmlTags(questionContent) : '';
  const cleanAnswerContent = answerContent ? removeHtmlTags(answerContent) : '';

  // 문의 내용 요약 (최대 200자)
  const questionPreview = cleanQuestionContent
    ? cleanQuestionContent.length > 200
      ? cleanQuestionContent.substring(0, 200) + '...'
      : cleanQuestionContent
    : '내용 없음';

  // 답변 내용 요약 (최대 500자)
  const answerPreview = cleanAnswerContent
    ? cleanAnswerContent.length > 500
      ? cleanAnswerContent.substring(0, 500) + '...'
      : cleanAnswerContent
    : '답변 내용 없음';

  const message = `💬 문의에 답변이 등록되었습니다

제목: ${questionTitle}
답변자: ${answeredByName}

문의 내용:
${questionPreview}

답변 내용:
${answerPreview}

문의 상세 페이지에서 확인하세요.`;

  return createKakaoTextMessage(message, webUrl);
}

// 기존 피드 메시지 함수들 (호환성 유지)
export function createQuestionNotificationMessage(
  questionTitle: string,
  authorName: string,
  questionContent?: string,
  webUrl?: string,
): KakaoFeedMessage {
  // 문의 내용 요약 (최대 100자)
  const contentPreview = questionContent
    ? questionContent.length > 100
      ? questionContent.substring(0, 100) + '...'
      : questionContent
    : '내용 없음';

  return createKakaoFeedMessage(
    '새로운 문의가 등록되었습니다',
    `제목: ${questionTitle}\n작성자: ${authorName}\n\n내용: ${contentPreview}\n\n관리자 페이지에서 확인하세요.`,
    webUrl,
  );
}

// 문의 답변 알림 메시지 생성
export function createQuestionAnswerNotificationMessage(
  questionTitle: string,
  answeredByName: string,
  questionContent?: string,
  answerContent?: string,
  webUrl?: string,
): KakaoFeedMessage {
  // 문의 내용 요약 (최대 50자)
  const questionPreview = questionContent
    ? questionContent.length > 50
      ? questionContent.substring(0, 50) + '...'
      : questionContent
    : '내용 없음';

  // 답변 내용 요약 (최대 100자)
  const answerPreview = answerContent
    ? answerContent.length > 100
      ? answerContent.substring(0, 100) + '...'
      : answerContent
    : '답변 내용 없음';

  return createKakaoFeedMessage(
    '문의에 답변이 등록되었습니다',
    `제목: ${questionTitle}\n답변자: ${answeredByName}\n\n문의: ${questionPreview}\n\n답변: ${answerPreview}\n\n문의 상세 페이지에서 확인하세요.`,
    webUrl,
  );
}
