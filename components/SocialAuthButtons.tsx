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
    <Flex direction="column" gap="5">
      <Button
        style={{ background: '#f8dc5f', color: '#181600' }}
        onClick={() =>
          signIn('kakao', {
            callbackUrl: isSignup ? '/welcome' : `/check-signup?callbackUrl=${callbackUrl}`,
          })
        }
        size="4"
      >
        <Image
          src="/kakao_icon.png"
          alt="Kakao"
          width={24}
          height={24}
          style={{ marginRight: 8 }}
        />
        카카오로 {isSignup ? '회원가입하기' : '로그인'}
      </Button>
      <Button
        style={{ background: '#06be34', color: 'white' }}
        onClick={() =>
          signIn('naver', {
            callbackUrl: isSignup ? '/welcome' : `/check-signup?callbackUrl=${callbackUrl}`,
          })
        }
        size="4"
      >
        <Image
          src="/naver_icon.png"
          alt="Naver"
          width={24}
          height={24}
          style={{ marginRight: 8 }}
        />
        네이버로 {isSignup ? '회원가입하기' : '로그인'}
      </Button>
    </Flex>
  );
}
