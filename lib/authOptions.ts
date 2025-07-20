import GoogleProvider from 'next-auth/providers/google';
import NaverProvider from 'next-auth/providers/naver';
import KakaoProvider from 'next-auth/providers/kakao';
import { getUserByEmail } from '@/service/user';
import type { JWT } from 'next-auth/jwt';
import type { Session, User } from 'next-auth';

// 사용자 세션 타입 확장
interface SessionUserWithLevel extends User {
  level?: number;
}
interface SessionWithLevel extends Session {
  user?: SessionUserWithLevel;
}
interface JWTWithLevel extends JWT {
  level?: number;
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
      },
    },
  },
  callbacks: {
    async jwt({ token, user }: { token: JWTWithLevel; user?: User }) {
      // 최초 로그인 시 user가 존재
      if (user && user.email) {
        // DB에서 level 조회
        const dbUser = await getUserByEmail(user.email);
        token.level = dbUser?.level ?? 0;
      }
      return token;
    },
    async session({ session, token }: { session: SessionWithLevel; token: JWTWithLevel }) {
      // 세션에 level 추가
      if (session.user) {
        session.user.level = token.level ?? 0;
      }
      return session;
    },
  },
};
