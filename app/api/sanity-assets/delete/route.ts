import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/sanity/lib/client';

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const assetId = searchParams.get('id');

    if (!assetId) {
      return NextResponse.json({ error: 'Asset ID가 필요합니다.' }, { status: 400 });
    }

    // Sanity Assets에서 파일 삭제
    await client.delete(assetId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Sanity Assets 삭제 실패:', error);
    return NextResponse.json({ error: '파일 삭제 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
