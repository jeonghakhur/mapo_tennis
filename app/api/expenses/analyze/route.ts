import { NextRequest, NextResponse } from 'next/server';
import { analyzeReceiptWithGPT } from '@/lib/gptVisionUtils';

export async function POST(req: NextRequest) {
  try {
    // 환경변수 확인
    console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);

    const formData = await req.formData();
    const imageFile = formData.get('image') as File;
    const customPrompt = formData.get('prompt') as string;

    if (!imageFile) {
      return NextResponse.json({ error: '이미지 파일이 없습니다.' }, { status: 400 });
    }

    // GPT Vision으로 이미지 분석 (사용자 정의 프롬프트 사용)
    const extractedData = await analyzeReceiptWithGPT(imageFile, customPrompt);

    return NextResponse.json({
      success: true,
      data: extractedData,
    });
  } catch (error) {
    console.error('이미지 분석 실패:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '이미지 분석에 실패했습니다.' },
      { status: 500 },
    );
  }
}
