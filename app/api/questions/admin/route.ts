import { NextRequest, NextResponse } from 'next/server';
import { withPermission } from '@/lib/apiUtils';
import { getAllQuestions } from '@/service/question';

// 전체 문의 목록 (관리자 전용)
export async function GET(req: NextRequest) {
  return withPermission(req, 5, async () => {
    const questions = await getAllQuestions();
    return NextResponse.json({ questions });
  });
}
