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
      'application/haansofthwp', // 한글 문서 (.hwp)
      'application/vnd.hancom.hwp', // 한글 문서 (.hwp)
      'application/vnd.hancom.hwpx', // 한글 문서 (.hwpx)
      'application/x-hwp', // 한글 문서 (.hwp) 대체 MIME 타입
      'application/octet-stream', // 바이너리 파일 (일부 시스템에서 .hwp가 이 타입으로 인식됨)
      'text/plain',
    ];

    // 허용된 파일 확장자
    const allowedExtensions = [
      '.jpg',
      '.jpeg',
      '.png',
      '.gif',
      '.webp',
      '.heic',
      '.heif',
      '.avif',
      '.pdf',
      '.doc',
      '.docx',
      '.xls',
      '.xlsx',
      '.hwp',
      '.hwpx',
      '.txt',
    ];

    // 파일 확장자 추출
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

    // 파일 타입 검증 (허용된 타입, 이미지 파일, 또는 허용된 확장자)
    const isValidType =
      allowedTypes.includes(file.type) ||
      file.type.startsWith('image/') ||
      allowedExtensions.includes(fileExtension);

    // 디버깅을 위한 로그 추가
    console.log('업로드 파일 정보:', {
      name: file.name,
      type: file.type,
      extension: fileExtension,
      size: file.size,
      isValidType,
      allowedTypes,
      allowedExtensions,
    });

    if (!isValidType) {
      return NextResponse.json(
        {
          error: `지원하지 않는 파일 타입입니다. 파일 타입: ${file.type}, 파일명: ${file.name}, 확장자: ${fileExtension}`,
        },
        { status: 400 },
      );
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
