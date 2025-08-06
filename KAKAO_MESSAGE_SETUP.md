# 카카오톡 메시지 전송 기능 설정 가이드

## 1. 카카오 개발자 계정 설정

### 1.1 카카오 개발자 계정 생성

1. [Kakao Developers](https://developers.kakao.com/) 접속
2. 카카오 계정으로 로그인
3. 애플리케이션 생성

### 1.2 애플리케이션 설정

1. **앱 이름**: 마포테니스 (또는 원하는 이름)
2. **사업자명**: 개인 또는 회사명
3. **카테고리**: 기타 > 기타

### 1.3 플랫폼 설정

1. **Web 플랫폼 추가**
   - 사이트 도메인: `http://localhost:3000` (개발용)
   - 사이트 도메인: `https://your-domain.vercel.app` (배포용)

### 1.4 카카오 로그인 설정

1. **카카오 로그인 활성화**
2. **Redirect URI 설정**:
   - `http://localhost:3000/api/auth/callback/kakao` (개발용)
   - `https://your-domain.vercel.app/api/auth/callback/kakao` (배포용)

### 1.5 카카오톡 메시지 설정

1. **카카오톡 메시지 활성화**
2. **메시지 템플릿 설정**:
   - 템플릿 이름: "문의 등록 알림"
   - 템플릿 내용: "새로운 문의가 등록되었습니다"

## 2. 환경 변수 설정

### 2.1 개발 환경 (.env.local)

```env
# 카카오 API 설정
KAKAO_CLIENT_ID=your-kakao-client-id
KAKAO_CLIENT_SECRET=your-kakao-client-secret

# 배포 URL
NEXTAUTH_URL=http://localhost:3000
```

### 2.2 배포 환경 (Vercel)

```env
# 카카오 API 설정
KAKAO_CLIENT_ID=your-kakao-client-id
KAKAO_CLIENT_SECRET=your-kakao-client-secret

# 배포 URL
NEXTAUTH_URL=https://your-domain.vercel.app
```

## 3. 카카오톡 메시지 권한 설정

### 3.1 카카오톡 메시지 권한 요청

카카오톡 메시지를 보내려면 다음 권한이 필요합니다:

1. **카카오톡 메시지 전송 권한**
   - 사용자가 카카오톡 메시지 수신에 동의해야 함
   - 카카오 로그인 시 추가 동의 항목으로 설정

### 3.2 추가 동의 항목 설정

카카오 로그인 시 다음 스코프를 추가로 요청:

```javascript
// authOptions.ts에서 KakaoProvider 설정 수정
KakaoProvider({
  clientId: process.env.KAKAO_CLIENT_ID || '',
  clientSecret: process.env.KAKAO_CLIENT_SECRET || '',
  authorization: {
    params: {
      scope: 'profile_nickname profile_image account_email talk_message',
    },
  },
}),
```

## 4. 사용 방법

### 4.1 관리자 설정

1. 레벨 4 이상의 관리자가 카카오로 로그인
2. 카카오톡 메시지 수신 동의
3. 액세스 토큰이 자동으로 저장됨

### 4.2 문의 등록 시 자동 알림

1. 사용자가 문의 등록
2. 레벨 4 이상 관리자에게 자동으로 카카오톡 메시지 전송
3. 메시지 내용:
   - 제목: "새로운 문의가 등록되었습니다"
   - 내용: 문의 제목, 작성자 정보
   - 링크: 관리자 페이지로 이동

## 5. 주의사항

### 5.1 카카오톡 메시지 제한

- 하루 최대 5,000건의 메시지 전송 가능
- 사용자가 메시지 수신을 차단할 수 있음
- 액세스 토큰은 만료될 수 있음 (갱신 필요)

### 5.2 보안 고려사항

- 액세스 토큰은 안전하게 저장
- 메시지 전송 실패 시 로그 기록
- 개인정보 보호를 위한 메시지 내용 검토

## 6. 문제 해결

### 6.1 메시지 전송 실패

1. 액세스 토큰 유효성 확인
2. 카카오톡 메시지 권한 확인
3. 사용자 차단 여부 확인

### 6.2 토큰 만료

1. 카카오 로그인 재시도
2. 새로운 액세스 토큰 발급
3. 토큰 갱신 로직 구현 고려

## 7. 추가 기능

### 7.1 메시지 템플릿 다양화

- 문의 답변 알림
- 토너먼트 참가 신청 알림
- 지출내역 등록 알림

### 7.2 메시지 전송 로그

- 전송 성공/실패 로그
- 수신자별 전송 이력
- 메시지 내용 저장
