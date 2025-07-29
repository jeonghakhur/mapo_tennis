import { createClient } from '@sanity/client';

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2025-07-08',
  useCdn: false,
  token: process.env.SANITY_TOKEN, // 환경 변수에서 토큰 가져오기
});

async function migrateLikedByToReference() {
  try {
    console.log('likedBy 필드를 reference 타입으로 마이그레이션 시작...');

    // 모든 포스트 조회
    const posts = await client.fetch(`
      *[_type == "post"] {
        _id,
        title,
        likedBy
      }
    `);

    console.log(`총 ${posts.length}개의 포스트를 찾았습니다.`);

    for (const post of posts) {
      console.log(`포스트 "${post.title}" (${post._id}) 처리 중...`);

      if (post.likedBy && Array.isArray(post.likedBy)) {
        // 기존 likedBy가 string 배열인지 확인
        const hasStringValues = post.likedBy.some((item) => typeof item === 'string');

        if (hasStringValues) {
          console.log(`  - likedBy 필드를 reference 형식으로 변환 중...`);

          // string 배열을 reference 배열로 변환 (고유한 _key 추가)
          const referenceArray = post.likedBy
            .filter((item) => typeof item === 'string')
            .map((userId, index) => ({
              _key: `likedBy_${userId}_${index}`,
              _ref: userId,
            }));

          // 포스트 업데이트
          await client.patch(post._id).set({ likedBy: referenceArray }).commit();

          console.log(`  - 포스트 "${post.title}" 업데이트 완료`);
        } else {
          console.log(`  - 포스트 "${post.title}"는 이미 올바른 형식입니다.`);
        }
      } else {
        console.log(`  - 포스트 "${post.title}"는 likedBy 필드가 없습니다.`);
      }
    }

    console.log('모든 포스트 마이그레이션 완료!');
  } catch (error) {
    console.error('마이그레이션 중 오류 발생:', error);
  }
}

migrateLikedByToReference();
