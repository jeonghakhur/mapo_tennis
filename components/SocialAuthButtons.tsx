'use client';
import { Button, Flex } from '@radix-ui/themes';
import { signIn } from 'next-auth/react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

export default function SocialAuthButtons({ mode }: { mode: 'login' | 'signup' }) {
  const isSignup = mode === 'signup';
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  return (
    <Flex direction="column" gap="3" align="center" style={{ width: 280 }}>
      <Button
        style={{ background: '#fee500', color: '#181600' }}
        onClick={() => signIn('kakao', { callbackUrl: isSignup ? '/welcome' : callbackUrl })}
        size="3"
      >
        <img src="/kakao.svg" alt="Kakao" width={24} height={24} style={{ marginRight: 8 }} />
        카카오로 {isSignup ? '회원가입하기' : '로그인'}
      </Button>
      <Button
        style={{ background: '#03c75a', color: 'white' }}
        onClick={() => signIn('naver', { callbackUrl: isSignup ? '/welcome' : callbackUrl })}
        size="3"
      >
        <img src="/naver.svg" alt="Naver" width={24} height={24} style={{ marginRight: 8 }} />
        네이버로 {isSignup ? '회원가입하기' : '로그인'}
      </Button>
      <Button
        style={{ background: '#fff', color: '#222', border: '1px solid #ccc' }}
        onClick={() => signIn('google', { callbackUrl: isSignup ? '/welcome' : callbackUrl })}
        size="3"
      >
        <img src="/google.svg" width={18} height={18} alt="Google" style={{ marginRight: 8 }} />
        구글로 {isSignup ? '회원가입하기' : '로그인'}
      </Button>
    </Flex>
  );
}
