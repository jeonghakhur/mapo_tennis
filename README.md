# Mapogu Tennis Association

마포구 테니스 협회 공식 웹사이트

## 🚀 PWA (Progressive Web App) 기능

이 웹사이트는 PWA로 구성되어 있어 홈화면에 추가할 수 있습니다.

### 📱 홈화면 추가 방법

1. **Chrome/Edge 브라우저**:
   - 주소창 옆의 설치 아이콘 클릭
   - "설치" 버튼 클릭

2. **Safari (iOS)**:
   - 공유 버튼 탭
   - "홈 화면에 추가" 선택

3. **Chrome (Android)**:
   - 메뉴 → "홈 화면에 추가"
   - "추가" 버튼 클릭

### ✨ PWA 특징

- **풀스크린 모드**: 주소 표시줄 없이 앱처럼 실행
- **오프라인 지원**: Service Worker를 통한 캐싱
- **네이티브 앱 경험**: 부드러운 애니메이션과 터치 최적화
- **자동 업데이트**: 새로운 버전 자동 감지

### 🔧 PWA 설정 파일

- `public/manifest.json`: 앱 메타데이터 및 설정
- `public/sw.js`: Service Worker (오프라인 캐싱)
- `components/PWAInstaller.tsx`: PWA 설치 로직
- `components/PWAInstallPrompt.tsx`: 설치 프롬프트 UI

## 🛠️ 개발 환경 설정

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build
```

## 📁 프로젝트 구조

```
mapo_tennis/
├── app/                    # Next.js 13 App Router
├── components/             # 재사용 가능한 컴포넌트
├── lib/                    # 유틸리티 함수
├── model/                  # 데이터 모델
├── service/                # API 서비스
├── hooks/                  # 커스텀 훅
├── public/                 # 정적 파일 (PWA 아이콘 포함)
└── sanity/                 # Sanity CMS 설정
```

## 🎨 기술 스택

- **Frontend**: Next.js 13, React, TypeScript
- **UI**: Radix UI, Tailwind CSS
- **CMS**: Sanity
- **Authentication**: NextAuth.js
- **PWA**: Service Worker, Web App Manifest

## 📱 모바일 최적화

- 반응형 디자인
- 터치 친화적 UI
- 모바일 브라우저 최적화
- PWA 풀스크린 모드

## 🔐 권한 관리

- 회원 레벨별 기능 제한
- 관리자 전용 기능
- 안전한 API 엔드포인트

## 📞 문의

마포구 테니스 협회에 문의하세요.

## 개발 가이드

### SWR 훅 작성 시 낙관적 업데이트 원칙

- 데이터 생성, 수정, 삭제 등 서버와 동기화가 필요한 작업에서는 반드시 SWR의 `optimisticData` 옵션을 활용해 낙관적 업데이트(Optimistic UI)를 구현해야 합니다.
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
- mutate의 첫 번째 인자로 직접 데이터를 넘기는 방식은 사용하지 않습니다.
- 일관된 UX와 코드 유지보수를 위해 위 원칙을 반드시 준수해 주세요.

---

### Next.js Route Handler 시그니처 주의사항 (자주 발생하는 오류)

- Next.js 13/14 App Router의 API Route(Handler)에서 두 번째 인자(context)의 타입과 사용법에 주의해야 합니다.
- 아래와 같이 두 번째 인자를 구조분해({ params })로 바로 받으면 타입 에러가 발생할 수 있습니다.

  ```ts
  // ❌ 잘못된 예시 (빌드 에러 발생)
  export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    // ...
  }
  ```

- 반드시 context 전체 객체로 받고, 내부에서 context.params.id로 접근해야 합니다.

  ```ts
  // ✅ 올바른 예시
  export async function GET(request: NextRequest, context: { params: { id: string } }) {
    const { id } = context.params;
    // ...
  }
  ```

- PUT, DELETE 등 다른 메서드도 동일하게 적용해 주세요.
- 이 규칙을 지키지 않으면 "Type ... is not a valid type for the function's second argument"와 같은 빌드 에러가 발생합니다.
