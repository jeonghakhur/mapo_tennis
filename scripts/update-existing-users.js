import { client } from '../sanity/lib/client';

async function updateExistingUsers() {
  try {
    console.log('기존 사용자 데이터에 isApprovedUser 필드 추가 중...');

    // isApprovedUser 필드가 없는 사용자들을 찾기
    const usersWithoutApproval = await client.fetch(`
      *[_type == "user" && !defined(isApprovedUser)] {
        _id,
        name,
        email
      }
    `);

    console.log(`총 ${usersWithoutApproval.length}명의 사용자를 업데이트합니다.`);

    // 각 사용자에 isApprovedUser: false 추가
    for (const user of usersWithoutApproval) {
      await client.patch(user._id).set({ isApprovedUser: false }).commit();
      console.log(`사용자 "${user.name}" (${user.email}) 업데이트 완료`);
    }

    console.log('모든 사용자 업데이트 완료!');
  } catch (error) {
    console.error('업데이트 중 오류 발생:', error);
  }
}

// 스크립트 실행
updateExistingUsers();
