# 개발 가이드

## 코드 작성 규칙

### 1. 컴포넌트 작성

- 함수형 컴포넌트 사용
- TypeScript 타입 정의 필수
- Props 인터페이스 명시적 정의
- 한국어 주석 작성

```typescript
interface ComponentProps {
  title: string;
  onSave: (data: any) => void;
}

export default function Component({ title, onSave }: ComponentProps) {
  // 컴포넌트 로직
}
```

### 2. API 라우트 작성

- Next.js App Router 사용
- 에러 핸들링 포함
- 타입 안전성 보장

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // API 로직
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: '에러 메시지' }, { status: 500 });
  }
}
```

### 3. 커스텀 훅 작성

- `use` 접두사 사용
- SWR 활용
- 에러 상태 관리

```typescript
export function useCustomHook() {
  const { data, error, mutate } = useSWR('/api/endpoint', fetcher);

  return {
    data,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}
```

### 4. 스타일링

- Radix UI 컴포넌트 우선 사용
- Tailwind CSS 클래스 활용
- 반응형 디자인 고려

### 5. 폼 처리

- React Hook Form 사용 권장
- 유효성 검사 포함
- 에러 메시지 한국어

### 6. 상태 관리

- SWR을 통한 서버 상태 관리
- React useState/useReducer 로컬 상태
- Context API 필요한 경우에만 사용

### 7. Optimistic Updates (즉각적인 UI 반영)

- SWR의 `mutate`와 `optimisticData` 활용
- 사용자 액션에 즉시 UI 반영 후 서버 동기화
- 에러 발생 시 이전 상태로 롤백

```typescript
// 예시: 토너먼트 신청 시 즉각적인 UI 반영
const handleApply = async () => {
  // 1. Optimistic update - 즉시 UI 반영
  mutate(
    `/api/tournament-applications/${tournamentId}`,
    (currentData) => ({
      ...currentData,
      isApplied: true,
      applicationCount: (currentData.applicationCount || 0) + 1,
    }),
    false, // 서버 요청 전에 즉시 반영
  );

  try {
    // 2. 실제 서버 요청
    await fetch(`/api/tournament-applications/${tournamentId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(applicationData),
    });

    // 3. 성공 시 서버 데이터로 동기화
    mutate(`/api/tournament-applications/${tournamentId}`);
  } catch (error) {
    // 4. 실패 시 이전 상태로 롤백
    mutate(`/api/tournament-applications/${tournamentId}`);
    console.error('신청 실패:', error);
  }
};
```

#### Optimistic Updates 패턴

```typescript
// 일반적인 패턴
const optimisticUpdate = async (action, optimisticData, apiCall) => {
  // 1. Optimistic update
  mutate(key, optimisticData, false);

  try {
    // 2. API 호출
    await apiCall();
    // 3. 성공 시 서버 데이터로 동기화
    mutate(key);
  } catch (error) {
    // 4. 실패 시 롤백
    mutate(key);
    throw error;
  }
};
```

#### 사용 예시들

- **좋아요/북마크**: 즉시 하트/별 아이콘 변경
- **폼 제출**: 제출 버튼 비활성화 및 로딩 상태
- **댓글 작성**: 즉시 댓글 목록에 추가
- **상태 변경**: 토글 버튼 즉시 반영

## 파일 구조 규칙

### 컴포넌트

- 재사용 가능한 컴포넌트는 `components/` 디렉토리
- 페이지별 컴포넌트는 해당 페이지 디렉토리 내부
- UI 컴포넌트는 `components/ui/`

### API 라우트

- RESTful API 설계
- 리소스별 디렉토리 구조
- 동적 라우트는 `[id]` 형식

### 타입 정의

- 공통 타입은 `types/` 디렉토리
- 모델별 타입은 `model/` 디렉토리
- 확장 타입은 `types/next-auth.d.ts`

## 에러 처리

### 클라이언트 사이드

```typescript
try {
  const result = await apiCall();
} catch (error) {
  console.error('에러 발생:', error);
  // 사용자에게 적절한 메시지 표시
}
```

### 서버 사이드

```typescript
export async function handler() {
  try {
    // 로직
  } catch (error) {
    console.error('서버 에러:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
```

## 성능 최적화

### 이미지 최적화

- Next.js Image 컴포넌트 사용
- 적절한 크기와 포맷 선택

### 코드 분할

- 동적 import 사용
- 페이지별 코드 분할

### 캐싱

- SWR 캐싱 전략 활용
- 적절한 revalidate 설정

## 보안 고려사항

### 인증

- NextAuth.js 세션 관리
- API 라우트에서 세션 검증

### 데이터 검증

- 입력 데이터 검증
- XSS 방지
- CSRF 보호

## 테스트

### 단위 테스트

- 컴포넌트 테스트
- 유틸리티 함수 테스트

### 통합 테스트

- API 엔드포인트 테스트
- 사용자 플로우 테스트

## 배포

### 환경 변수

- `.env.local` 로컬 개발
- 프로덕션 환경 변수 설정

### 빌드 최적화

- Next.js 빌드 최적화
- 번들 크기 최적화
