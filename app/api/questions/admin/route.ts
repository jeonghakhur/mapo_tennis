import { NextRequest, NextResponse } from 'next/server';
import { withPermission } from '@/lib/apiUtils';
import { getAllQuestions } from '@/service/question';

// 전체 문의 목록 (레벨 4 이상)
export async function GET(req: NextRequest) {
  return withPermission(req, 4, async () => {
    const questions = await getAllQuestions();
    return NextResponse.json({ questions });
  });
}
