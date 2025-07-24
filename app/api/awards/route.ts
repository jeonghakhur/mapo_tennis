import { NextRequest, NextResponse } from 'next/server';
import { withPermission } from '@/lib/apiUtils';
import { awardService } from '@/service/award';

// GET: 전체 수상 결과 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const competition = searchParams.get('competition');
    const year = searchParams.get('year');
    const division = searchParams.get('division');

    let awards;
    if (competition && year) {
      awards = await awardService.getAwardsByCompetition(competition, parseInt(year));
    } else if (division) {
      awards = await awardService.getAwardsByDivision(division);
    } else {
      awards = await awardService.getAllAwards();
    }

    return NextResponse.json(awards);
  } catch (error) {
    console.error('Awards GET error:', error);
    return NextResponse.json({ error: '수상 결과를 불러오는데 실패했습니다.' }, { status: 500 });
  }
}

// POST: 수상 결과 등록 핸들러
async function createAwardHandler(req: NextRequest) {
  try {
    const body = await req.json();
    const award = await awardService.createAward(body);

    return NextResponse.json(award, { status: 201 });
  } catch (error) {
    console.error('Awards POST error:', error);
    return NextResponse.json({ error: '수상 결과 등록에 실패했습니다.' }, { status: 500 });
  }
}

// POST: 수상 결과 등록 (권한 체크 포함)
export async function POST(req: NextRequest) {
  // 고급 사용자 권한 확인 (level 3 이상)
  return withPermission(req, 3, createAwardHandler);
}
