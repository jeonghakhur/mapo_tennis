import { client } from '@/sanity/lib/client';
import type {
  TournamentApplication,
  TournamentApplicationInput,
} from '@/model/tournamentApplication';

// 참가 신청 생성
export async function createTournamentApplication(
  data: TournamentApplicationInput,
  userId: string,
): Promise<TournamentApplication> {
  const now = new Date().toISOString();

  const applicationData: Omit<TournamentApplication, '_id'> = {
    _type: 'tournamentApplication',
    tournamentId: data.tournamentId,
    division: data.division,
    tournamentType: data.tournamentType,
    teamMembers: data.teamMembers,

    status: 'pending',
    memo: data.memo,
    isFeePaid: data.isFeePaid,
    createdAt: now,
    createdBy: userId,
  };

  return await client.create(applicationData);
}

// 대회별 참가 신청 목록 조회
export async function getTournamentApplications(
  tournamentId: string,
): Promise<TournamentApplication[]> {
  return await client.fetch(
    `*[_type == "tournamentApplication" && tournamentId == $tournamentId] | order(createdAt desc)`,
    { tournamentId },
  );
}

// 전체 참가 신청 목록 조회 (관리자용)
export async function getAllTournamentApplications(): Promise<TournamentApplication[]> {
  const applications = await client.fetch(
    `*[_type == "tournamentApplication"] | order(createdAt desc)`,
  );

  // 각 참가신청에 대회 정보, 순서, 신청자 정보 추가
  const applicationsWithTournaments = await Promise.all(
    applications.map(async (application: TournamentApplication) => {
      if (application.tournamentId) {
        try {
          const tournament = await client.fetch(
            `*[_type == "tournament" && _id == $tournamentId][0] {
              _id,
              title,
              location,
              startDate,
              endDate
            }`,
            { tournamentId: application.tournamentId },
          );

          // 해당 대회의 해당 부서에서 몇 번째 신청인지 계산
          const applicationOrder = await client.fetch(
            `count(*[_type == "tournamentApplication" && tournamentId == $tournamentId && division == $division && createdAt <= $createdAt])`,
            {
              tournamentId: application.tournamentId,
              division: application.division,
              createdAt: application.createdAt,
            },
          );

          // 신청자 정보 가져오기
          const applicant = await client.fetch(
            `*[_type == "user" && _id == $createdBy][0] {
              _id,
              name,
              email
            }`,
            { createdBy: application.createdBy },
          );

          return {
            ...application,
            tournament: tournament || null,
            applicationOrder: applicationOrder || 0,
            applicant: applicant || null,
          };
        } catch (error) {
          console.error(`대회 정보 조회 실패 (tournamentId: ${application.tournamentId}):`, error);
          return {
            ...application,
            tournament: null,
            applicationOrder: 0,
            applicant: null,
          };
        }
      }
      return application;
    }),
  );

  return applicationsWithTournaments;
}

// 참가 신청 개별 조회
export async function getTournamentApplication(id: string): Promise<TournamentApplication | null> {
  return await client.fetch(`*[_type == "tournamentApplication" && _id == $id][0]`, { id });
}

// 참가 신청 상태 업데이트
export async function updateTournamentApplicationStatus(
  id: string,
  status: 'pending' | 'approved' | 'rejected' | 'cancelled',
): Promise<TournamentApplication> {
  const now = new Date().toISOString();

  return await client
    .patch(id)
    .set({
      status,
      updatedAt: now,
    })
    .commit();
}

// 참가 신청 수정
export async function updateTournamentApplication(
  id: string,
  data: Partial<TournamentApplicationInput>,
): Promise<TournamentApplication> {
  const now = new Date().toISOString();

  const updateData: Record<string, unknown> = {
    updatedAt: now,
  };

  if (data.division) updateData.division = data.division;
  if (data.tournamentType) updateData.tournamentType = data.tournamentType;
  if (data.teamMembers) updateData.teamMembers = data.teamMembers;

  if (data.memo !== undefined) updateData.memo = data.memo;
  if (data.isFeePaid !== undefined) updateData.isFeePaid = data.isFeePaid;

  console.log('서비스 함수 업데이트 데이터:', updateData);
  const result = await client.patch(id).set(updateData).commit();
  console.log('서비스 함수 업데이트 결과:', result);
  return result as unknown as TournamentApplication;
}

// 참가 신청 삭제
export async function deleteTournamentApplication(id: string): Promise<void> {
  await client.delete(id);
}

// 사용자별 참가 신청 목록 조회
export async function getUserTournamentApplications(
  userId: string,
): Promise<TournamentApplication[]> {
  const applications = await client.fetch(
    `*[_type == "tournamentApplication" && createdBy == $userId] | order(createdAt desc)`,
    { userId },
  );

  // 각 참가신청에 대회 정보와 순서 추가
  const applicationsWithTournaments = await Promise.all(
    applications.map(async (application: TournamentApplication) => {
      if (application.tournamentId) {
        try {
          const tournament = await client.fetch(
            `*[_type == "tournament" && _id == $tournamentId][0] {
              _id,
              title,
              location,
              startDate,
              endDate
            }`,
            { tournamentId: application.tournamentId },
          );

          // 해당 대회의 해당 부서에서 몇 번째 신청인지 계산
          const applicationOrder = await client.fetch(
            `count(*[_type == "tournamentApplication" && tournamentId == $tournamentId && division == $division && createdAt <= $createdAt])`,
            {
              tournamentId: application.tournamentId,
              division: application.division,
              createdAt: application.createdAt,
            },
          );

          return {
            ...application,
            tournament: tournament || null,
            applicationOrder: applicationOrder || 0,
          };
        } catch (error) {
          console.error(`대회 정보 조회 실패 (tournamentId: ${application.tournamentId}):`, error);
          return {
            ...application,
            tournament: null,
            applicationOrder: 0,
          };
        }
      }
      return application;
    }),
  );

  return applicationsWithTournaments;
}

// 클럽 회원 검색 (이름으로)
export async function searchClubMemberByName(name: string, clubId: string) {
  return await client.fetch(
    `*[_type == "clubMember" && user == $name && club._ref == $clubId][0] {
      _id,
      user,
      birth,
      score,
      club->{_id, name}
    }`,
    { name, clubId },
  );
}

// 클럽 목록 조회
export async function getClubs() {
  return await client.fetch(
    `*[_type == "club"] | order(name asc) {
      _id,
      name,
      location
    }`,
  );
}
