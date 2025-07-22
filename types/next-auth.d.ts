// 1) next-auth 타입 import
import type { DefaultSession } from 'next-auth/next';

// 2) 유저·세션 보강은 "모듈 보강(declare module)"에서 DefaultSession을 확장
declare module 'next-auth' {
  interface Session extends DefaultSession {
    user?: DefaultSession['user'] & {
      id: string;
      level?: number;
    };
  }

  interface User {
    level?: number;
  }
}
