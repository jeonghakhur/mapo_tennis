export interface SanityAsset {
  _id: string;
  url: string;
  originalFilename: string;
  size: number;
  mimeType: string;
}

// Sanity Assets를 사용한 파일 업로드
export async function uploadToSanityAssets(file: File): Promise<SanityAsset> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/sanity-assets/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '파일 업로드에 실패했습니다.');
    }

    const result = await response.json();
    return result.asset;
  } catch (error) {
    console.error('Sanity Assets 업로드 실패:', error);
    throw new Error('파일 업로드에 실패했습니다.');
  }
}

// 이미지 파일 업로드 (이미지 최적화 포함)
export async function uploadImageToSanityAssets(file: File): Promise<SanityAsset> {
  // 이미지 파일인지 확인
  if (!file.type.startsWith('image/')) {
    throw new Error('이미지 파일만 업로드할 수 있습니다.');
  }

  return uploadToSanityAssets(file);
}

// Sanity Assets에서 파일 삭제
export async function deleteFromSanityAssets(assetId: string): Promise<void> {
  try {
    // Sanity Assets 삭제는 API를 통해 처리
    const response = await fetch(`/api/sanity-assets/delete?id=${assetId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('파일 삭제에 실패했습니다.');
    }

    console.log(`Sanity Assets 파일 삭제 완료: ${assetId}`);
  } catch (error) {
    console.error('Sanity Assets 파일 삭제 실패:', error);
    throw new Error('파일 삭제에 실패했습니다.');
  }
}

// URL에서 Asset ID 추출
export function extractAssetIdFromUrl(url: string): string | null {
  // Sanity Assets URL 형식: https://cdn.sanity.io/...
  const match = url.match(/\/assets\/([^\/]+)\//);
  return match ? match[1] : null;
}
