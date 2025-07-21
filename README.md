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
