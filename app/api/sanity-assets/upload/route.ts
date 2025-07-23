import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/sanity/lib/client';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 });
    }

    // 파일 크기 제한 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: '파일 크기는 10MB를 초과할 수 없습니다.' },
        { status: 400 },
      );
    }

    // 허용된 파일 타입
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/heic', // 아이폰 HEIC 포맷
      'image/heif', // 아이폰 HEIF 포맷
      'image/avif', // 최신 이미지 포맷
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
    ];

    // 파일 타입 검증 (허용된 타입 또는 이미지 파일)
    const isValidType = allowedTypes.includes(file.type) || file.type.startsWith('image/');
    if (!isValidType) {
      return NextResponse.json({ error: '지원하지 않는 파일 타입입니다.' }, { status: 400 });
    }

    // 이미지 파일인지 확인하여 적절한 타입으로 업로드
    const assetType = file.type.startsWith('image/') ? 'image' : 'file';

    // Sanity Assets로 업로드
    const asset = await client.assets.upload(assetType, file, {
      filename: file.name,
    });

    const result = {
      _id: asset._id,
      url: asset.url,
      originalFilename: file.name,
      size: file.size,
      mimeType: file.type,
    };

    return NextResponse.json({
      success: true,
      asset: result,
    });
  } catch (error) {
    console.error('Sanity Assets 업로드 실패:', error);
    return NextResponse.json({ error: '파일 업로드 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
