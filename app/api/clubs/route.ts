import { NextResponse } from 'next/server';
import { getClubs } from '@/service/tournamentApplication';

export async function GET() {
  try {
    const clubs = await getClubs();
    return NextResponse.json(clubs);
  } catch (error) {
    console.error('클럽 목록 조회 오류:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
