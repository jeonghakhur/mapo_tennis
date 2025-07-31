import GoogleProvider from 'next-auth/providers/google';
import NaverProvider from 'next-auth/providers/naver';
import KakaoProvider from 'next-auth/providers/kakao';
import { getUserByEmail } from '@/service/user';
import type { JWT } from 'next-auth/jwt';
import type { Session, User, Account } from 'next-auth';

// 사용자 세션 타입 확장
interface SessionUserWithLevel extends User {
  level?: number;
  phone?: string;
  birth?: string;
  gender?: string;
}
interface SessionWithLevel extends Session {
  user?: SessionUserWithLevel;
}
interface JWTWithLevel extends JWT {
  level?: number;
  phone?: string;
  birth?: string;
  gender?: string;
}

export const authOptions = {
  providers: [
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID || '',
      clientSecret: process.env.KAKAO_CLIENT_SECRET || '',
    }),
    NaverProvider({
      clientId: process.env.NAVER_CLIENT_ID || '',
      clientSecret: process.env.NAVER_CLIENT_SECRET || '',
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: '/auth/signin',
  },
  secret: process.env.NEXTAUTH_SECRET,
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  callbacks: {
    async jwt({
      token,
      user,
      account,
    }: {
      token: JWTWithLevel;
      user?: User;
      account?: Account | null;
    }) {
      if (account?.provider === 'kakao' && account.access_token) {
        try {
          const res = await fetch('https://kapi.kakao.com/v2/user/me', {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${account.access_token}`,
            },
          });

          if (!res.ok) {
            throw new Error('카카오 API 호출 실패');
          }

          const data = await res.json();
          const kakaoAccount = data.kakao_account;

          token.email = kakaoAccount.email;
          token.name = kakaoAccount.profile?.nickname;
          token.phone = kakaoAccount.phone_number;
          token.birth = kakaoAccount.birthyear;
          token.gender = kakaoAccount.gender;
        } catch (error) {
          console.error('카카오 API 호출 중 오류 발생:', error);
        }
      }

      if (account?.provider === 'naver' && account.access_token) {
        try {
          const res = await fetch('https://openapi.naver.com/v1/nid/me', {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${account.access_token}`,
            },
          });

          if (!res.ok) throw new Error('네이버 사용자 정보 요청 실패');

          const data = await res.json();
          const user = data.response;

          token.name = user.name;
          token.email = user.email;
          token.gender = user.gender; // F/M
          token.birth = user.birthyear; // "1990"
          token.phone = user.mobile; // "010-1234-5678"
        } catch (error) {
          console.error('네이버 사용자 정보 오류:', error);
        }
      }
      // 최초 로그인 시 user가 존재 및 이메일이 있는 경우
      if (user && user.email) {
        // DB에서 level 조회
        const dbUser = await getUserByEmail(user.email);
        token.name = token.name ?? dbUser?.name ?? user.name;
        token.level = dbUser?.level ?? 0;
        token.id = dbUser?._id as string;
      }
      return token;
    },
    async session({ session, token }: { session: SessionWithLevel; token: JWTWithLevel }) {
      // 세션에 level 추가
      if (session.user) {
        session.user.name = token.name;
        session.user.level = token.level ?? 0;
        session.user.id = token.id as string;
        session.user.phone = token.phone as string;
        session.user.birth = token.birth as string;
        session.user.gender = token.gender as string;
      }
      return session;
    },
  },
};
