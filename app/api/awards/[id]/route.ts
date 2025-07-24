import { NextRequest, NextResponse } from 'next/server';
import { withPermission, UserWithLevel } from '@/lib/apiUtils';
import { awardService } from '@/service/award';

// GET: 개별 수상 결과 조회
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(request: NextRequest, context: any) {
  try {
    const award = await awardService.getAwardById(context.params.id);
    if (!award) {
      return NextResponse.json({ error: '수상 결과를 찾을 수 없습니다.' }, { status: 404 });
    }
    return NextResponse.json(award);
  } catch (error) {
    console.error('Award GET error:', error);
    return NextResponse.json({ error: '수상 결과를 불러오는데 실패했습니다.' }, { status: 500 });
  }
}

// PUT: 수상 결과 수정 핸들러
async function updateAwardHandler(req: NextRequest, user: UserWithLevel, params: { id: string }) {
  try {
    const body = await req.json();
    const award = await awardService.updateAward(params.id, body);

    return NextResponse.json(award);
  } catch (error) {
    console.error('Award PUT error:', error);
    return NextResponse.json({ error: '수상 결과 수정에 실패했습니다.' }, { status: 500 });
  }
}

// PUT: 수상 결과 수정 (권한 체크 포함)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PUT(req: NextRequest, context: any) {
  return withPermission(req, 3, (req, user) => updateAwardHandler(req, user, context.params));
}

// DELETE: 수상 결과 삭제 핸들러
async function deleteAwardHandler(req: NextRequest, user: UserWithLevel, params: { id: string }) {
  try {
    await awardService.deleteAward(params.id);

    return NextResponse.json({ message: '수상 결과가 삭제되었습니다.' });
  } catch (error) {
    console.error('Award DELETE error:', error);
    return NextResponse.json({ error: '수상 결과 삭제에 실패했습니다.' }, { status: 500 });
  }
}

// DELETE: 수상 결과 삭제 (권한 체크 포함)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function DELETE(req: NextRequest, context: any) {
  return withPermission(req, 3, (req, user) => deleteAwardHandler(req, user, context.params));
}
