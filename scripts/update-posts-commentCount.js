import { createClient } from '@sanity/client';

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2025-07-08',
  useCdn: false,
  token: process.env.SANITY_TOKEN, // 환경 변수에서 토큰 가져오기
});

async function updatePostsCommentCount() {
  try {
    console.log('기존 포스트들의 commentCount 필드 업데이트 시작...');

    // 모든 포스트 조회
    const posts = await client.fetch(`
      *[_type == "post"] {
        _id,
        title,
        commentCount
      }
    `);

    console.log(`총 ${posts.length}개의 포스트를 찾았습니다.`);

    // 각 포스트에 대해 commentCount 필드 추가
    for (const post of posts) {
      if (post.commentCount === undefined) {
        console.log(`포스트 "${post.title}" (${post._id})에 commentCount 필드 추가 중...`);

        await client.patch(post._id).set({ commentCount: 0 }).commit();

        console.log(`포스트 "${post.title}" 업데이트 완료`);
      } else {
        console.log(`포스트 "${post.title}"는 이미 commentCount 필드가 있습니다.`);
      }
    }

    console.log('모든 포스트 업데이트 완료!');
  } catch (error) {
    console.error('업데이트 중 오류 발생:', error);
  }
}

// 스크립트 실행
updatePostsCommentCount();
