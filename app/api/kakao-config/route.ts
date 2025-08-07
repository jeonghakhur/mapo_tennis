import { NextResponse } from 'next/server';

export async function GET() {
  const kakaoClientId = process.env.KAKAO_CLIENT_ID;
  console.log('카카오 클라이언트 ID:', kakaoClientId ? '설정됨' : '설정되지 않음');

  return NextResponse.json({
    kakaoAppKey: kakaoClientId,
  });
}
