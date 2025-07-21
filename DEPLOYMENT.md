# 배포 환경 설정

## 필수 환경 변수

배포 환경에서 로그아웃이 정상적으로 작동하려면 다음 환경 변수들이 설정되어야 합니다:

### NextAuth 설정

```env
# NextAuth 시크릿 (필수)
NEXTAUTH_SECRET=your-secret-key-here

# 배포 URL (필수)
NEXTAUTH_URL=https://your-domain.vercel.app

# 소셜 로그인 설정
KAKAO_CLIENT_ID=your-kakao-client-id
KAKAO_CLIENT_SECRET=your-kakao-client-secret
NAVER_CLIENT_ID=your-naver-client-id
NAVER_CLIENT_SECRET=your-naver-client-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Sanity 설정

```env
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your-api-token
```

## 문제 해결

### 로그아웃이 안 되는 경우

1. `NEXTAUTH_SECRET`이 설정되어 있는지 확인
2. `NEXTAUTH_URL`이 올바른 배포 URL로 설정되어 있는지 확인
3. 브라우저 개발자 도구에서 쿠키가 제대로 삭제되는지 확인

### 환경 변수 생성 방법

```bash
# NEXTAUTH_SECRET 생성
openssl rand -base64 32
```

## Vercel 배포 시 주의사항

- 환경 변수는 Vercel 대시보드에서 설정
- 프로덕션 환경과 프리뷰 환경 모두 설정 필요
- 변경 후 재배포 필요
