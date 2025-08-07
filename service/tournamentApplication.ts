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
  division?: string,
): Promise<TournamentApplication[]> {
  // 특정 부서만 조회하는 경우
  if (division) {
    const query = `*[_type == "tournamentApplication" && tournamentId == $tournamentId && division == $division] | order(createdAt asc) {
        _id,
        _type,
        tournamentId,
        division,
        tournamentType,
        teamMembers,
        status,
        memo,
        isFeePaid,
        createdAt,
        updatedAt,
        createdBy,
        contact,
        email,
        // 대회 정보를 직접 조인
        "tournament": *[_type == "tournament" && _id == ^.tournamentId][0] {
          _id,
          title,
          location,
          startDate,
          endDate
        },
        // 신청자 정보를 직접 조인
        "applicant": *[_type == "user" && _id == ^.createdBy][0] {
          _id,
          name,
          email
        }
      }`;

    const applications = await client.fetch(query, { tournamentId, division });

    // 해당 부서 내에서 순서 계산 (가장 먼저 신청한 사람이 1번째)
    return applications.map((app: TournamentApplication, index: number) => ({
      ...app,
      applicationOrder: index + 1,
    }));
  }

  // 모든 부서의 신청을 가져와서 부서별로 순서 계산
  const query = `*[_type == "tournamentApplication" && tournamentId == $tournamentId] | order(createdAt asc) {
      _id,
      _type,
      tournamentId,
      division,
      tournamentType,
      teamMembers,
      status,
      memo,
      isFeePaid,
      createdAt,
      updatedAt,
      createdBy,
      contact,
      email,
      // 대회 정보를 직접 조인
      "tournament": *[_type == "tournament" && _id == ^.tournamentId][0] {
        _id,
        title,
        location,
        startDate,
        endDate
      },
      // 신청자 정보를 직접 조인
      "applicant": *[_type == "user" && _id == ^.createdBy][0] {
        _id,
        name,
        email
      }
    }`;

  const allApplications = await client.fetch(query, { tournamentId });

  // 부서별로 그룹화하여 각 부서에서 순서 계산
  const applicationsByDivision: Record<string, TournamentApplication[]> = {};

  allApplications.forEach((app: TournamentApplication) => {
    if (!applicationsByDivision[app.division]) {
      applicationsByDivision[app.division] = [];
    }
    applicationsByDivision[app.division].push(app);
  });

  // 각 부서별로 순서 계산하고 하나의 배열로 합치기
  const applicationsWithOrder: TournamentApplication[] = [];

  Object.entries(applicationsByDivision).forEach(([division, divisionApps]) => {
    // 각 부서 내에서 가장 먼저 신청한 사람이 1번째가 되도록 정렬 (createdAt asc)
    const sortedDivisionApps = divisionApps.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    // 해당 부서에서 순서 계산 (가장 먼저 신청한 사람이 1번째)
    sortedDivisionApps.forEach((app, index) => {
      applicationsWithOrder.push({
        ...app,
        applicationOrder: index + 1,
      });
    });
  });

  return applicationsWithOrder;
}

// 전체 참가 신청 목록 조회 (관리자용) - 최적화된 버전
export async function getAllTournamentApplications(): Promise<TournamentApplication[]> {
  // 한 번의 쿼리로 모든 데이터를 가져오기
  const applications = await client.fetch(`
    *[_type == "tournamentApplication"] | order(createdAt asc) {
      _id,
      _type,
      tournamentId,
      division,
      tournamentType,
      teamMembers,
      status,
      memo,
      isFeePaid,
      createdAt,
      updatedAt,
      createdBy,
      contact,
      email,
      // 대회 정보를 직접 조인
      "tournament": *[_type == "tournament" && _id == ^.tournamentId][0] {
        _id,
        title,
        location,
        startDate,
        endDate
      },
      // 신청자 정보를 직접 조인
      "applicant": *[_type == "user" && _id == ^.createdBy][0] {
        _id,
        name,
        email
      }
    }
  `);

  // 부서별로 그룹화하여 각 부서에서 순서 계산
  const applicationsByDivision: Record<string, TournamentApplication[]> = {};

  applications.forEach((app: TournamentApplication) => {
    if (!applicationsByDivision[app.division]) {
      applicationsByDivision[app.division] = [];
    }
    applicationsByDivision[app.division].push(app);
  });

  // 각 부서별로 순서 계산하고 하나의 배열로 합치기
  const applicationsWithOrder: TournamentApplication[] = [];

  Object.entries(applicationsByDivision).forEach(([division, divisionApps]) => {
    // 각 부서 내에서 가장 먼저 신청한 사람이 1번째가 되도록 정렬 (createdAt asc)
    const sortedDivisionApps = divisionApps.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    // 해당 부서에서 순서 계산 (가장 먼저 신청한 사람이 1번째)
    sortedDivisionApps.forEach((app, index) => {
      applicationsWithOrder.push({
        ...app,
        applicationOrder: index + 1,
      });
    });
  });

  return applicationsWithOrder;
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
    `*[_type == "tournamentApplication" && createdBy == $userId] | order(createdAt desc) {
      _id,
      _type,
      tournamentId,
      division,
      tournamentType,
      teamMembers,
      status,
      memo,
      isFeePaid,
      createdAt,
      updatedAt,
      createdBy,
      contact,
      email,
      // 대회 정보를 직접 조인
      "tournament": *[_type == "tournament" && _id == ^.tournamentId][0] {
        _id,
        title,
        location,
        startDate,
        endDate
      },
      // 신청자 정보를 직접 조인
      "applicant": *[_type == "user" && _id == ^.createdBy][0] {
        _id,
        name,
        email
      }
    }`,
    { userId },
  );

  // applicationOrder는 클라이언트에서 계산하거나 필요시 별도 쿼리로 처리
  return applications.map((application: TournamentApplication) => ({
    ...application,
    applicationOrder: 0, // 필요시 별도 계산
  }));
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
