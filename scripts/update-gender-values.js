import { createClient } from '@sanity/client';
import dotenv from 'dotenv';

// 환경 변수 로드
dotenv.config({ path: '.env.local' });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2025-07-08',
  token: process.env.SANITY_SECRET_TOKEN,
  useCdn: false,
});

async function updateGenderValues() {
  try {
    console.log('성별 값 업데이트를 시작합니다...');

    // gender 필드가 '남성' 또는 '여성'인 모든 user 문서 조회
    const query = `*[_type == "user" && (gender == "남성" || gender == "여성")] {
      _id,
      _rev,
      gender,
      name
    }`;

    const documents = await client.fetch(query);
    console.log(`총 ${documents.length}개의 문서를 찾았습니다.`);

    if (documents.length === 0) {
      console.log('업데이트할 문서가 없습니다.');
      return;
    }

    // 각 문서의 성별 값 업데이트
    const updatePromises = documents.map(async (doc) => {
      const newGender = doc.gender === '남성' ? '남' : '여';

      console.log(`업데이트: ${doc.name} (${doc.gender} → ${newGender})`);

      return client.patch(doc._id).set({ gender: newGender }).commit();
    });

    await Promise.all(updatePromises);
    console.log('모든 문서의 성별 값이 성공적으로 업데이트되었습니다.');
  } catch (error) {
    console.error('업데이트 중 오류가 발생했습니다:', error);
  }
}

// 스크립트 실행
updateGenderValues();
