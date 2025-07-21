# 마포 테니스 프로젝트 컨텍스트

## 프로젝트 개요

- **프로젝트명**: 마포 테니스 (mapo-tennis)
- **기술 스택**: Next.js 14, TypeScript, Radix UI, NextAuth.js, Sanity CMS
- **목적**: 테니스 클럽 관리 및 토너먼트 운영 플랫폼

## 주요 기능

1. **사용자 인증**: 소셜 로그인 (Google, Kakao, Naver)
2. **클럽 관리**: 클럽 생성, 멤버 관리, 비용 관리
3. **토너먼트**: 토너먼트 생성, 신청, 관리
4. **게시물**: 마크다운 에디터를 통한 게시물 작성
5. **알림**: 실시간 알림 시스템

## 프로젝트 구조

```
mapo-tennis/
├── app/                    # Next.js App Router
│   ├── api/               # API 라우트
│   ├── auth/              # 인증 관련 페이지
│   ├── club/              # 클럽 관리
│   ├── expenses/          # 비용 관리
│   ├── tournaments/       # 토너먼트 관리
│   └── ...
├── components/            # 재사용 가능한 컴포넌트
├── hooks/                # 커스텀 훅
├── lib/                  # 유틸리티 함수
├── model/                # 데이터 모델
├── service/              # 비즈니스 로직
├── sanity/               # Sanity CMS 설정
└── types/                # TypeScript 타입 정의
```

## 주요 컴포넌트

- `SocialAuthButtons`: 소셜 로그인 버튼
- `TournamentForm`: 토너먼트 생성/편집 폼
- `ExpenseForm`: 비용 관리 폼
- `MarkdownEditor`: 마크다운 에디터
- `Navbar`: 네비게이션 바

## 데이터 모델

- **User**: 사용자 정보
- **Club**: 테니스 클럽
- **ClubMember**: 클럽 멤버
- **Tournament**: 토너먼트
- **TournamentApplication**: 토너먼트 신청
- **Expense**: 비용 관리
- **Post**: 게시물
- **Notification**: 알림

## 인증 시스템

- NextAuth.js를 사용한 소셜 로그인
- Google, Kakao, Naver 지원
- 세션 기반 인증

## 스타일링

- Radix UI 컴포넌트 사용
- Tailwind CSS (PostCSS)
- 반응형 디자인

## 개발 환경

- Node.js
- TypeScript
- ESLint 설정
- 코드 포맷팅 자동화

## 주요 라이브러리

- `next-auth`: 인증
- `@radix-ui/themes`: UI 컴포넌트
- `@sanity/client`: CMS
- `swr`: 데이터 페칭 및 Optimistic Updates
- `react-markdown`: 마크다운 렌더링

## UI/UX 패턴

- **Optimistic Updates**: 사용자 액션 즉시 반영 후 서버 동기화
- **로딩 상태**: 스켈레톤 UI 및 로딩 오버레이
- **에러 처리**: 사용자 친화적인 에러 메시지
- **반응형 디자인**: 모바일 우선 접근법

## 코드 스타일 가이드

- TypeScript 사용
- 함수형 컴포넌트
- 커스텀 훅 활용
- 컴포넌트 분리 및 재사용성 고려
- 한국어 주석 및 메시지
