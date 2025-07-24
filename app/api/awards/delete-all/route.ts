import { NextRequest, NextResponse } from 'next/server';
import { withPermission } from '@/lib/apiUtils';
import { awardService } from '@/service/award';

// DELETE: 전체 수상 결과 삭제 핸들러
async function deleteAllAwardsHandler() {
  try {
    await awardService.deleteAllAwards();
    return NextResponse.json({ message: '전체 수상 결과가 삭제되었습니다.' });
  } catch (error) {
    console.error('Awards DELETE ALL error:', error);
    return NextResponse.json({ error: '전체 수상 결과 삭제에 실패했습니다.' }, { status: 500 });
  }
}

// DELETE: 전체 수상 결과 삭제 (권한 체크 포함)
export async function DELETE(req: NextRequest) {
  return withPermission(req, 3, () => deleteAllAwardsHandler());
}
