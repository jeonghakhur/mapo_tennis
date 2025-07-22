# 개발 가이드

## 코드 작성 규칙

### 1. 컴포넌트 작성

- 함수형 컴포넌트 사용
- TypeScript 타입 정의 필수
- Props 인터페이스 명시적 정의
- 한국어 주석 작성
- **텍스트 사이즈는 3을 기본값으로 사용**

#### 텍스트 사이즈 가이드라인

```typescript
// 기본 텍스트 (권장)
<Text size="3">기본 텍스트</Text>

// 제목 텍스트
<Text size="5" weight="bold">페이지 제목</Text>
<Text size="4" weight="bold">섹션 제목</Text>

// 작은 텍스트
<Text size="2">부가 정보, 설명</Text>
<Text size="1">레이블, 메타 정보</Text>

// 큰 텍스트
<Text size="6" weight="bold">메인 헤드라인</Text>
```

#### 텍스트 사용 패턴

| 용도              | 사이즈                   | 예시                  |
| ----------------- | ------------------------ | --------------------- |
| **기본 텍스트**   | `size="3"`               | 일반적인 내용, 설명   |
| **페이지 제목**   | `size="5" weight="bold"` | 페이지 상단 제목      |
| **섹션 제목**     | `size="4" weight="bold"` | 카드, 섹션 제목       |
| **부가 정보**     | `size="2"`               | 설명, 부가 설명       |
| **레이블**        | `size="1"`               | 폼 라벨, 메타 정보    |
| **메인 헤드라인** | `size="6" weight="bold"` | 랜딩 페이지 메인 제목 |

#### 폼 요소 사이즈 가이드라인

- **기본 사이즈**: 모든 폼 요소는 `size="3"`을 기본값으로 사용
- **일관성**: TextField, Button, Select 등 모든 폼 요소의 사이즈 통일

```typescript
// 텍스트 필드 (권장)
<TextField.Root size="3" placeholder="입력해 주세요" />

// 버튼 (권장)
<Button size="3">저장</Button>

// 셀렉트 (권장)
<Select.Root size="3">
  <Select.Trigger />
  <Select.Content>
    <Select.Item value="option1">옵션 1</Select.Item>
  </Select.Content>
</Select.Root>

// 라디오 그룹 (권장)
<RadioGroup.Root size="3">
  <RadioGroup.Item value="option1" />
  <RadioGroup.Item value="option2" />
</RadioGroup.Root>
```

#### 폼 요소 사용 패턴

| 요소           | 사이즈     | 예시           |
| -------------- | ---------- | -------------- |
| **TextField**  | `size="3"` | 입력 필드      |
| **Button**     | `size="3"` | 액션 버튼      |
| **Select**     | `size="3"` | 드롭다운 선택  |
| **RadioGroup** | `size="3"` | 라디오 버튼    |
| **Checkbox**   | `size="3"` | 체크박스       |
| **TextArea**   | `size="3"` | 긴 텍스트 입력 |

#### 테이블 사용 가이드라인

- **HTML 테이블 사용**: Radix UI Table 대신 일반 HTML `<table>` 사용
- **반응형 디자인**: 모바일에서 스크롤 가능하도록 구현
- **일관된 스타일링**: CSS 클래스로 테이블 스타일 통일

```typescript
// HTML 테이블 사용 (권장)
<table className="w-full border-collapse">
  <thead>
    <tr className="bg-gray-50">
      <th className="p-3 text-left border-b">이름</th>
      <th className="p-3 text-left border-b">이메일</th>
      <th className="p-3 text-left border-b">전화번호</th>
    </tr>
  </thead>
  <tbody>
    {items.map((item) => (
      <tr key={item.id} className="border-b hover:bg-gray-50">
        <td className="p-3">{item.name}</td>
        <td className="p-3">{item.email}</td>
        <td className="p-3">{item.phone}</td>
      </tr>
    ))}
  </tbody>
</table>

// 반응형 테이블 컨테이너
<div className="overflow-x-auto">
  <table className="min-w-full">
    {/* 테이블 내용 */}
  </table>
</div>
```

#### 테이블 스타일 클래스

```css
/* 기본 테이블 스타일 */
.table-container {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th {
  background-color: #f8fafc;
  padding: 12px;
  text-align: left;
  font-weight: 600;
  border-bottom: 1px solid #e2e8f0;
}

.table td {
  padding: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.table tr:hover {
  background-color: #f8fafc;
}
```

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
- **표준화된 권한 체크 시스템 사용**

#### 기본 API 라우트 패턴

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

#### 권한 체크가 필요한 API 라우트 패턴

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withPermission } from '@/lib/apiUtils';

// 핸들러 함수 정의
async function apiHandler(req: NextRequest, user: any) {
  try {
    // API 로직 (사용자 정보는 user 매개변수로 접근)
    const result = await someService();

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('API 오류:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

// 권한 체크와 함께 라우트 내보내기
export async function POST(req: NextRequest) {
  // 관리자 권한 확인 (level 5 이상)
  return withPermission(req, 5, apiHandler);
}

export async function PUT(req: NextRequest) {
  // 기본 사용자 권한 확인 (level 1 이상)
  return withPermission(req, 1, apiHandler);
}
```

#### 권한 레벨 정의

```typescript
// lib/apiUtils.ts
export const PERMISSION_LEVELS = {
  READ_ONLY: 1, // 읽기 전용
  BASIC_USER: 2, // 기본 사용자
  ADVANCED_USER: 3, // 고급 사용자
  POST_MANAGER: 4, // 게시글 관리자
  ADMIN: 5, // 관리자
} as const;
```

#### 권한 체크 함수들

```typescript
// lib/apiUtils.ts

// 1. 기본 권한 확인
export async function checkPermission(minLevel: number = 1): Promise<PermissionResult>;

// 2. 범용 권한 확인 래퍼 (권장)
export async function withPermission(
  req: NextRequest,
  minLevel: number,
  handler: (req: NextRequest, user: UserWithLevel) => Promise<NextResponse>,
);

// 3. 사용자 인증 및 정보 조회
export async function authenticateUser();

// 4. 본인 또는 관리자 권한 확인
export function checkOwnershipOrAdmin(user: User, resourceCreatedBy: string);

// 5. 토너먼트 신청 관련 권한 확인
export function checkTournamentApplicationPermission(
  user: User,
  application: TournamentApplication,
  action: 'read' | 'update' | 'delete',
);
```

### 3. 커스텀 훅 작성

- `use` 접두사 사용
- SWR 활용
- 에러 상태 관리
- **로딩 상태 관리 포함**

#### 기본 커스텀 훅 패턴

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

#### 로딩 상태 관리 훅 사용

```typescript
import { useLoading } from '@/hooks/useLoading';

export function useCustomHook() {
  const { loading, withLoading } = useLoading();
  const { data, error, mutate } = useSWR('/api/endpoint', fetcher);

  const handleAction = async () => {
    return withLoading(async () => {
      const result = await fetch('/api/action', { method: 'POST' });
      await mutate(); // 데이터 새로고침
      return result;
    });
  };

  return {
    data,
    isLoading: !error && !data,
    isError: error,
    loading, // 수동 로딩 상태
    handleAction,
    mutate,
  };
}
```

### 7. Optimistic Updates (즉각적인 UI 반영)

- 서버와 동기화가 필요한 데이터 생성, 수정, 삭제 작업에서는 반드시 SWR의 `mutate`와 `optimisticData` 옵션을 활용해 낙관적 업데이트(Optimistic UI)를 구현해야 합니다.
- mutate의 첫 번째 인자로 직접 데이터를 넘기는 방식은 사용하지 않습니다.
- 일관된 UX와 코드 유지보수를 위해 아래 원칙을 반드시 준수해 주세요.
- 예시:
  ```ts
  await mutate(
    async () => { /* 서버 요청 */ },
    {
      optimisticData: /* UI에 미리 반영할 데이터 */,
      rollbackOnError: true,
      revalidate: true,
    }
  );
  ```
- 사용자 액션에 즉시 UI 반영 후 서버 동기화
- 에러 발생 시 이전 상태로 롤백

### 4. 스타일링

- Radix UI 컴포넌트 우선 사용
- Tailwind CSS 클래스 활용
- 반응형 디자인 고려
- **로딩 상태 UI 컴포넌트 활용**

#### 로딩 상태 UI 가이드라인

##### 1. 스켈레톤 카드 사용 (데이터 로딩 시)

```typescript
import SkeletonCard from '@/components/SkeletonCard';

export default function DataList() {
  const { data, isLoading } = useSWR('/api/data', fetcher);

  if (isLoading) {
    return <SkeletonCard lines={3} />;
  }

  return (
    <div>
      {data.map(item => (
        <DataCard key={item.id} data={item} />
      ))}
    </div>
  );
}
```

##### 2. 스피너 사용 (액션 로딩 시)

```typescript
import { useLoading } from '@/hooks/useLoading';
import { Button } from '@radix-ui/themes';
import { Loader2 } from 'lucide-react';

export default function ActionButton() {
  const { loading, withLoading } = useLoading();

  const handleSubmit = async () => {
    return withLoading(async () => {
      await fetch('/api/submit', { method: 'POST' });
    });
  };

  return (
    <Button
      onClick={handleSubmit}
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          처리 중...
        </>
      ) : (
        '제출'
      )}
    </Button>
  );
}
```

##### 2-1. 전체 화면 로딩 오버레이 사용

```typescript
import { useLoading } from '@/hooks/useLoading';
import LoadingOverlay from '@/components/LoadingOverlay';

export default function DataProcessingPage() {
  const { loading, withLoading } = useLoading();

  const handleProcessData = async () => {
    return withLoading(async () => {
      // 시간이 오래 걸리는 작업
      await fetch('/api/process-data', { method: 'POST' });
    });
  };

  return (
    <div>
      <Button onClick={handleProcessData} disabled={loading}>
        데이터 처리 시작
      </Button>

      {loading && <LoadingOverlay size="3" />}
    </div>
  );
}
```

##### 3. 로딩 상태별 UI 패턴

| 로딩 유형            | 사용 컴포넌트     | 사용 시기               | 예시                     |
| -------------------- | ----------------- | ----------------------- | ------------------------ |
| **초기 데이터 로딩** | `SkeletonCard`    | 페이지/컴포넌트 첫 로드 | 게시글 목록, 사용자 목록 |
| **버튼 액션 로딩**   | `Loader2` 스피너  | 버튼 클릭 시            | 폼 제출, 삭제, 수정      |
| **전체 화면 로딩**   | `LoadingOverlay`  | 긴 작업 시              | 데이터 처리, 파일 업로드 |
| **백그라운드 로딩**  | `useLoading` 상태 | 데이터 새로고침         | SWR mutate               |

##### 4. 스켈레톤 카드 커스터마이징

```typescript
// 기본 사용
<SkeletonCard />

// 라인 수 조정
<SkeletonCard lines={4} />

// 높이 조정
<SkeletonCard cardHeight={200} />

// 스타일 커스터마이징
<SkeletonCard
  className="max-w-md mx-auto"
  lineClassName="border-l-4 border-blue-500"
/>
```

##### 4-1. 로딩 오버레이 커스터마이징

```typescript
// 기본 사용 (크기 3)
<LoadingOverlay />

// 작은 크기
<LoadingOverlay size="1" />

// 중간 크기
<LoadingOverlay size="2" />

// 큰 크기 (기본값)
<LoadingOverlay size="3" />
```

##### 5. 로딩 상태 관리 패턴

```typescript
// 1. SWR 자동 로딩 상태
const { data, isLoading } = useSWR('/api/data', fetcher);

// 2. 수동 로딩 상태
const { loading, withLoading } = useLoading();

// 3. 복합 로딩 상태
const { data, isLoading: dataLoading } = useSWR('/api/data', fetcher);
const { loading: actionLoading, withLoading } = useLoading();

const isAnyLoading = dataLoading || actionLoading;
```

### 5. 폼 처리

- React Hook Form 사용 권장
- 유효성 검사 포함
- 에러 메시지 한국어
- **액션 처리 후 AlertDialog 사용**

#### 액션 처리 후 피드백 가이드라인

##### 1. AlertDialog 컴포넌트 사용

```typescript
import ConfirmDialog from '@/components/ConfirmDialog';
import { useState } from 'react';

export default function UserEditPage() {
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (data: UserFormData) => {
    try {
      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setSuccessMessage('회원 정보가 성공적으로 수정되었습니다.');
        setShowSuccessDialog(true);
      } else {
        throw new Error('수정 실패');
      }
    } catch (error) {
      console.error('수정 오류:', error);
    }
  };

  return (
    <div>
      {/* 폼 컴포넌트 */}

      {/* 성공 알림 다이얼로그 */}
      <ConfirmDialog
        title="수정 완료"
        description={successMessage}
        confirmText="확인"
        confirmVariant="solid"
        confirmColor="green"
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        onConfirm={() => setShowSuccessDialog(false)}
      />
    </div>
  );
}
```

##### 2. 액션별 AlertDialog 패턴

| 액션 유형     | 제목        | 설명                                 | 색상  | 사용 시기      |
| ------------- | ----------- | ------------------------------------ | ----- | -------------- |
| **생성 성공** | "생성 완료" | "새로운 항목이 생성되었습니다."      | green | 데이터 생성 후 |
| **수정 성공** | "수정 완료" | "정보가 성공적으로 수정되었습니다."  | green | 데이터 수정 후 |
| **삭제 성공** | "삭제 완료" | "항목이 삭제되었습니다."             | green | 데이터 삭제 후 |
| **오류 발생** | "오류 발생" | "작업 중 오류가 발생했습니다."       | red   | 에러 발생 시   |
| **확인 필요** | "확인"      | "정말로 이 작업을 수행하시겠습니까?" | red   | 위험한 작업 전 |

##### 3. AlertDialog 사용 패턴

```typescript
// 1. 성공 알림
<ConfirmDialog
  title="수정 완료"
  description="회원 정보가 성공적으로 수정되었습니다."
  confirmText="확인"
  confirmColor="green"
  open={showSuccess}
  onOpenChange={setShowSuccess}
  onConfirm={() => setShowSuccess(false)}
/>

// 2. 삭제 확인
<ConfirmDialog
  title="삭제 확인"
  description="정말로 이 항목을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
  confirmText="삭제"
  cancelText="취소"
  confirmColor="red"
  onConfirm={handleDelete}
/>

// 3. 오류 알림
<ConfirmDialog
  title="오류 발생"
  description="작업 중 오류가 발생했습니다. 다시 시도해주세요."
  confirmText="확인"
  confirmColor="red"
  open={showError}
  onOpenChange={setShowError}
  onConfirm={() => setShowError(false)}
/>
```

### 6. 상태 관리

- SWR을 통한 서버 상태 관리
- React useState/useReducer 로컬 상태
- Context API 필요한 경우에만 사용

### 7. Optimistic Updates (즉각적인 UI 반영)

- 서버와 동기화가 필요한 데이터 생성, 수정, 삭제 작업에서는 반드시 SWR의 `mutate`와 `optimisticData` 옵션을 활용해 낙관적 업데이트(Optimistic UI)를 구현해야 합니다.
- mutate의 첫 번째 인자로 직접 데이터를 넘기는 방식은 사용하지 않습니다.
- 일관된 UX와 코드 유지보수를 위해 아래 원칙을 반드시 준수해 주세요.
- 예시:
  ```ts
  await mutate(
    async () => { /* 서버 요청 */ },
    {
      optimisticData: /* UI에 미리 반영할 데이터 */,
      rollbackOnError: true,
      revalidate: true,
    }
  );
  ```
- 사용자 액션에 즉시 UI 반영 후 서버 동기화
- 에러 발생 시 이전 상태로 롤백

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

### 로딩 상태 최적화

#### 1. 스켈레톤 로딩 전략

```typescript
// 페이지별 스켈레톤 컴포넌트
export default function PostsPage() {
  const { data: posts, isLoading } = useSWR('/api/posts', fetcher);

  if (isLoading) {
    return (
      <Container>
        <SkeletonCard lines={4} />
      </Container>
    );
  }

  return (
    <Container>
      {posts.map(post => <PostCard key={post.id} post={post} />)}
    </Container>
  );
}
```

#### 2. 점진적 로딩

```typescript
// 중요 데이터 먼저 로드
export default function TournamentPage() {
  const { data: tournament, isLoading: tournamentLoading } = useSWR('/api/tournament', fetcher);
  const { data: applications, isLoading: applicationsLoading } = useSWR('/api/applications', fetcher);

  if (tournamentLoading) {
    return <TournamentSkeleton />;
  }

  return (
    <div>
      <TournamentInfo tournament={tournament} />
      {applicationsLoading ? (
        <ApplicationsSkeleton />
      ) : (
        <ApplicationsList applications={applications} />
      )}
    </div>
  );
}
```

#### 3. 로딩 상태 캐싱

```typescript
// 로딩 상태를 캐시하여 깜빡임 방지
export function useOptimizedLoading() {
  const { data, isLoading } = useSWR('/api/data', fetcher, {
    keepPreviousData: true, // 이전 데이터 유지
    revalidateOnFocus: false, // 포커스 시 재검증 비활성화
  });

  return {
    data,
    isLoading: isLoading && !data, // 데이터가 있으면 로딩 표시 안함
  };
}
```

## 보안 고려사항

### 인증

- NextAuth.js 세션 관리
- API 라우트에서 세션 검증
- **표준화된 권한 체크 시스템 사용**

### 권한 체크 가이드라인

#### 1. 모든 보호된 API는 권한 체크 필수

```typescript
// ❌ 잘못된 방법 - 권한 체크 없음
export async function DELETE(req: NextRequest) {
  const result = await deleteResource();
  return NextResponse.json({ success: true });
}

// ✅ 올바른 방법 - 권한 체크 포함
export async function DELETE(req: NextRequest) {
  return withPermission(req, 5, async () => {
    const result = await deleteResource();
    return NextResponse.json({ success: true });
  });
}
```

#### 2. 권한 레벨별 사용 가이드

| 권한 레벨             | 용도             | 예시                       |
| --------------------- | ---------------- | -------------------------- |
| **1 (READ_ONLY)**     | 읽기 전용 API    | 게시글 조회, 토너먼트 목록 |
| **2 (BASIC_USER)**    | 기본 사용자 기능 | 댓글 작성, 프로필 수정     |
| **3 (ADVANCED_USER)** | 고급 사용자 기능 | 토너먼트 신청, 클럽 관리   |
| **4 (POST_MANAGER)**  | 게시글 관리      | 게시글 수정/삭제           |
| **5 (ADMIN)**         | 관리자 기능      | 모든 리소스 관리, 통계     |

#### 3. 특별한 권한 체크 패턴

```typescript
// 본인 또는 관리자만 접근 가능한 리소스
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await authenticateUser();
  if (authResult.error) return authResult.error;

  const resource = await getResource(params.id);
  const permissionResult = checkOwnershipOrAdmin(authResult.user, resource.createdBy);
  if (permissionResult.error) return permissionResult.error;

  // API 로직...
}

// 토너먼트 신청 특별 권한 체크
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await authenticateUser();
  if (authResult.error) return authResult.error;

  const application = await getTournamentApplication(params.id);
  const permissionResult = checkTournamentApplicationPermission(
    authResult.user,
    application,
    'delete',
  );
  if (permissionResult.error) return permissionResult.error;

  // API 로직...
}
```

### 데이터 검증

- 입력 데이터 검증
- XSS 방지
- CSRF 보호

## 테스트

### 단위 테스트

- 컴포넌트 테스트
- 유틸리티 함수 테스트
- **권한 체크 함수 테스트**

### 통합 테스트

- API 엔드포인트 테스트
- 사용자 플로우 테스트
- **권한별 API 접근 테스트**

### 권한 테스트 가이드라인

#### 1. 권한 체크 테스트

```typescript
// 권한 체크 함수 테스트 예시
describe('checkPermission', () => {
  it('관리자는 모든 권한에 접근 가능해야 함', async () => {
    const mockSession = { user: { level: 5 } };
    const result = await checkPermission(5);
    expect(result.hasPermission).toBe(true);
  });

  it('일반 사용자는 관리자 권한에 접근 불가해야 함', async () => {
    const mockSession = { user: { level: 2 } };
    const result = await checkPermission(5);
    expect(result.hasPermission).toBe(false);
  });
});
```

#### 2. API 권한 테스트

```typescript
// API 권한 테스트 예시
describe('DELETE /api/notifications/delete-all', () => {
  it('관리자는 모든 알림 삭제 가능해야 함', async () => {
    const response = await fetch('/api/notifications/delete-all', {
      method: 'DELETE',
      headers: { Authorization: 'Bearer admin-token' },
    });
    expect(response.status).toBe(200);
  });

  it('일반 사용자는 알림 삭제 불가해야 함', async () => {
    const response = await fetch('/api/notifications/delete-all', {
      method: 'DELETE',
      headers: { Authorization: 'Bearer user-token' },
    });
    expect(response.status).toBe(403);
  });
});
```

## 배포

### 환경 변수

- `.env.local` 로컬 개발
- 프로덕션 환경 변수 설정

### 빌드 최적화

- Next.js 빌드 최적화
- 번들 크기 최적화

## 권한 체크 시스템 체크리스트

### 새 API 라우트 작성 시

- [ ] `lib/apiUtils.ts`의 권한 체크 함수 사용
- [ ] 적절한 권한 레벨 설정 (1-5)
- [ ] 특별한 권한이 필요한 경우 별도 권한 체크 함수 사용
- [ ] 에러 응답 일관성 유지
- [ ] 테스트 코드 작성

### 기존 API 라우트 수정 시

- [ ] 수동 권한 체크를 `withPermission`으로 변경
- [ ] 권한 레벨 검토 및 조정
- [ ] 기존 기능 동작 확인
- [ ] 테스트 코드 업데이트

### 권한 체크 패턴

| 패턴                                             | 사용 시기            | 예시          |
| ------------------------------------------------ | -------------------- | ------------- |
| `withPermission(req, level, handler)`            | 일반적인 권한 체크   | 대부분의 API  |
| `authenticateUser()` + `checkOwnershipOrAdmin()` | 본인/관리자 체크     | 개인 리소스   |
| `checkTournamentApplicationPermission()`         | 특별한 비즈니스 로직 | 토너먼트 신청 |

### 권한 레벨 매핑

| 기능 영역       | 권한 레벨 | 설명                       |
| --------------- | --------- | -------------------------- |
| **읽기 전용**   | 1         | 게시글 조회, 목록 보기     |
| **기본 사용자** | 2         | 댓글, 프로필 수정          |
| **고급 사용자** | 3         | 토너먼트 신청, 클럽 관리   |
| **게시글 관리** | 4         | 게시글 작성/수정/삭제      |
| **관리자**      | 5         | 모든 기능, 통계, 일괄 관리 |

## 로딩 상태 관리 체크리스트

### 새 컴포넌트 작성 시

- [ ] 데이터 로딩 시 `SkeletonCard` 사용
- [ ] 버튼 액션 로딩 시 `Loader2` 스피너 사용
- [ ] 긴 작업 시 `LoadingOverlay` 사용
- [ ] 로딩 상태 관리는 `useLoading` 훅 사용
- [ ] 로딩 중 버튼 비활성화
- [ ] 적절한 로딩 메시지 표시

### 기존 컴포넌트 수정 시

- [ ] 로딩 상태가 없는 컴포넌트에 로딩 UI 추가
- [ ] 기존 로딩 로직을 표준화된 패턴으로 변경
- [ ] 스켈레톤, 스피너, 오버레이 구분하여 사용
- [ ] 긴 작업에는 `LoadingOverlay` 적용
- [ ] 로딩 상태 테스트 추가

### 로딩 상태 패턴

| 상황                 | 사용 컴포넌트    | 구현 방법                        |
| -------------------- | ---------------- | -------------------------------- |
| **페이지 초기 로딩** | `SkeletonCard`   | `isLoading` 상태로 조건부 렌더링 |
| **버튼 액션 로딩**   | `Loader2` 스피너 | `useLoading` 훅 사용             |
| **전체 화면 로딩**   | `LoadingOverlay` | 긴 작업 시 전체 화면 오버레이    |
| **백그라운드 로딩**  | 상태 표시 없음   | `withLoading` 함수 사용          |
| **폼 제출 로딩**     | 버튼 스피너      | `loading` 상태로 버튼 비활성화   |

### 로딩 상태 최적화 팁

- **스켈레톤 사용**: 데이터 로딩 시 실제 UI와 유사한 형태
- **스피너 사용**: 액션 로딩 시 간단한 회전 아이콘
- **로딩 오버레이 사용**: 긴 작업 시 전체 화면 차단
- **점진적 로딩**: 중요 데이터부터 순차적으로 로드
- **캐싱 활용**: 이전 데이터 유지로 깜빡임 방지
- **적절한 메시지**: 사용자에게 진행 상황 알림

## 액션 처리 후 피드백 체크리스트

### 새 컴포넌트 작성 시

- [ ] 성공 시 `ConfirmDialog` 사용
- [ ] 오류 시 적절한 에러 메시지 표시
- [ ] 로딩 상태 관리 (`useLoading` 훅 사용)
- [ ] 사용자 친화적인 메시지 작성
- [ ] 액션별 적절한 색상 선택 (성공: green, 오류: red)

### 기존 컴포넌트 수정 시

- [ ] 기존 alert/confirm을 `ConfirmDialog`로 변경
- [ ] 성공/오류 메시지 표준화
- [ ] 로딩 상태 추가
- [ ] 사용자 경험 개선

### 액션 처리 패턴

| 액션 유형     | 다이얼로그 제목 | 색상  | 사용 시기      |
| ------------- | --------------- | ----- | -------------- |
| **생성 성공** | "생성 완료"     | green | 데이터 생성 후 |
| **수정 성공** | "수정 완료"     | green | 데이터 수정 후 |
| **삭제 성공** | "삭제 완료"     | green | 데이터 삭제 후 |
| **오류 발생** | "오류 발생"     | red   | 에러 발생 시   |
| **확인 필요** | "확인"          | red   | 위험한 작업 전 |
