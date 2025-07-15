// 마크다운 텍스트에서 이미지 URL 추출
export function extractImageUrls(markdownContent: string): string[] {
  const imageRegex = /!\[.*?\]\((.*?)\)/g;
  const urls: string[] = [];
  let match;

  while ((match = imageRegex.exec(markdownContent)) !== null) {
    const url = match[1];
    // Sanity Assets URL만 처리
    if (url.includes('cdn.sanity.io')) {
      urls.push(url);
    }
  }

  return urls;
}

// Sanity Assets URL에서 Asset ID 추출
export function extractAssetIdFromUrl(url: string): string | null {
  // Sanity Assets URL 형식: https://cdn.sanity.io/...
  const match = url.match(/\/assets\/([^\/]+)\//);
  return match ? match[1] : null;
}

// Sanity Assets URL인지 확인
export function isSanityAssetUrl(url: string): boolean {
  return url.includes('cdn.sanity.io') || url.includes('/assets/');
}

// 테스트용 예제
export function testImageExtraction() {
  const testMarkdown = `
# 테스트 포스트

이미지 1: ![테스트 이미지](https://cdn.sanity.io/images/project-id/dataset/assets/1234567890_test.jpg)

다른 내용...

이미지 2: ![또 다른 이미지](https://cdn.sanity.io/images/project-id/dataset/assets/0987654321_another.png)

외부 이미지는 제외: ![외부 이미지](https://example.com/image.jpg)
  `;

  const urls = extractImageUrls(testMarkdown);
  console.log('추출된 이미지 URL들:', urls);
  return urls;
}
