import { client } from '../sanity/lib/client';

async function deleteAllTournamentApplications() {
  try {
    console.log('기존 참가 신청 데이터 삭제 중...');

    // 모든 참가 신청 데이터 조회
    const applications = await client.fetch(`*[_type == "tournamentApplication"]`);

    console.log(`총 ${applications.length}개의 참가 신청 데이터를 찾았습니다.`);

    if (applications.length === 0) {
      console.log('삭제할 데이터가 없습니다.');
      return;
    }

    // 각 참가 신청 데이터 삭제
    for (const application of applications) {
      await client.delete(application._id);
      console.log(`삭제됨: ${application._id}`);
    }

    console.log('모든 참가 신청 데이터가 삭제되었습니다.');
  } catch (error) {
    console.error('삭제 중 오류 발생:', error);
  }
}

// 스크립트 실행
deleteAllTournamentApplications();
