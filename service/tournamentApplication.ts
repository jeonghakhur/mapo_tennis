import { client } from '@/sanity/lib/client';
import type {
  TournamentApplication,
  TournamentApplicationInput,
} from '@/model/tournamentApplication';

// 공통 쿼리 필드 상수
const COMMON_FIELDS = {
  APPLICATION: `
    _id,
    _type,
    tournamentId,
    division,
    tournamentType,
    seed,
    status,
    memo,
    isFeePaid,
    createdAt,
    updatedAt,
    createdBy,
    contact,
    email
  `,
  TEAM_MEMBERS: `
    "teamMembers": teamMembers[] {
      _key,
      name,
      clubId,
      clubName,
      birth,
      score,
      isRegisteredMember,
      "clubMemberInfo": *[_type == "clubMember" && user == ^.name && club._ref == ^.clubId][0] {
        tennisStartYear,
        gender
      }
    }
  `,
  TOURNAMENT_INFO: `
    "tournament": *[_type == "tournament" && _id == ^.tournamentId][0] {
      _id,
      title,
      location,
      startDate,
      endDate,
      registrationDeadline
    }
  `,
  APPLICANT_INFO: `
    "applicant": *[_type == "user" && _id == ^.createdBy][0] {
      _id,
      name,
      email
    }
  `,
};

// 쿼리 빌더 함수들
function buildApplicationQuery(includeJoins = true): string {
  if (!includeJoins) {
    return `{
      ${COMMON_FIELDS.APPLICATION}
    }`;
  }

  return `{
    ${COMMON_FIELDS.APPLICATION},
    ${COMMON_FIELDS.TEAM_MEMBERS},
    ${COMMON_FIELDS.TOURNAMENT_INFO},
    ${COMMON_FIELDS.APPLICANT_INFO}
  }`;
}

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
  try {
    // 특정 부서만 조회하는 경우
    if (division) {
      const query = `*[_type == "tournamentApplication" && tournamentId == $tournamentId && division == $division] | order(createdAt asc) ${buildApplicationQuery()}`;

      const applications = await client.fetch(query, { tournamentId, division });

      // 해당 부서 내에서 순서 계산 (가장 먼저 신청한 사람이 1번째)
      return applications.map((app: TournamentApplication, index: number) => ({
        ...app,
        applicationOrder: index + 1,
      }));
    }

    // 모든 부서의 신청을 가져와서 부서별로 순서 계산
    const query = `*[_type == "tournamentApplication" && tournamentId == $tournamentId] | order(createdAt asc) ${buildApplicationQuery()}`;

    const allApplications = await client.fetch(query, { tournamentId });

    return calculateApplicationOrder(allApplications);
  } catch (error) {
    console.error('참가 신청 목록 조회 실패:', error);
    throw new Error('참가 신청 목록을 불러올 수 없습니다.');
  }
}

// 부서별 순서 계산 헬퍼 함수
function calculateApplicationOrder(applications: TournamentApplication[]): TournamentApplication[] {
  // 부서별로 그룹화
  const applicationsByDivision: Record<string, TournamentApplication[]> = {};

  applications.forEach((app: TournamentApplication) => {
    if (!applicationsByDivision[app.division]) {
      applicationsByDivision[app.division] = [];
    }
    applicationsByDivision[app.division].push(app);
  });

  // 각 부서별로 순서 계산하고 하나의 배열로 합치기
  const applicationsWithOrder: TournamentApplication[] = [];

  Object.entries(applicationsByDivision).forEach(([, divisionApps]) => {
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
  try {
    const query = `*[_type == "tournamentApplication" && _id == $id][0] ${buildApplicationQuery()}`;
    return await client.fetch(query, { id });
  } catch (error) {
    console.error('참가 신청 조회 실패:', error);
    throw new Error('참가 신청을 불러올 수 없습니다.');
  }
}

// 참가 신청 상태 업데이트
export async function updateTournamentApplicationStatus(
  id: string,
  status: 'pending' | 'approved' | 'rejected' | 'cancelled',
): Promise<TournamentApplication> {
  try {
    const now = new Date().toISOString();

    return await client
      .patch(id)
      .set({
        status,
        updatedAt: now,
      })
      .commit();
  } catch (error) {
    console.error('참가 신청 상태 업데이트 실패:', error);
    throw new Error('참가 신청 상태를 업데이트할 수 없습니다.');
  }
}

// 참가 신청 수정
export async function updateTournamentApplication(
  id: string,
  data: Partial<TournamentApplicationInput>,
): Promise<TournamentApplication> {
  try {
    const now = new Date().toISOString();

    const updateData: Record<string, unknown> = {
      updatedAt: now,
    };

    // 필드별 업데이트 로직
    if (data.division) updateData.division = data.division;
    if (data.tournamentType) updateData.tournamentType = data.tournamentType;
    if (data.teamMembers) updateData.teamMembers = data.teamMembers;
    if (data.memo !== undefined) updateData.memo = data.memo;
    if (data.isFeePaid !== undefined) updateData.isFeePaid = data.isFeePaid;

    const result = await client.patch(id).set(updateData).commit();
    return result as unknown as TournamentApplication;
  } catch (error) {
    console.error('참가 신청 수정 실패:', error);
    throw new Error('참가 신청을 수정할 수 없습니다.');
  }
}

// 참가 신청 삭제
export async function deleteTournamentApplication(id: string): Promise<void> {
  try {
    await client.delete(id);
  } catch (error) {
    console.error('참가 신청 삭제 실패:', error);
    throw new Error('참가 신청을 삭제할 수 없습니다.');
  }
}

// 사용자별 참가 신청 목록 조회
export async function getUserTournamentApplications(
  userId: string,
): Promise<TournamentApplication[]> {
  try {
    const query = `*[_type == "tournamentApplication" && createdBy == $userId] | order(createdAt desc) ${buildApplicationQuery()}`;
    const applications = await client.fetch(query, { userId });

    // applicationOrder는 클라이언트에서 계산하거나 필요시 별도 쿼리로 처리
    return applications.map((application: TournamentApplication) => ({
      ...application,
      applicationOrder: 0, // 필요시 별도 계산
    }));
  } catch (error) {
    console.error('사용자 참가 신청 목록 조회 실패:', error);
    throw new Error('사용자 참가 신청 목록을 불러올 수 없습니다.');
  }
}

// 클럽 회원 검색 (이름으로)
export async function searchClubMemberByName(name: string, clubId: string) {
  try {
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
  } catch (error) {
    console.error('클럽 회원 검색 실패:', error);
    throw new Error('클럽 회원을 검색할 수 없습니다.');
  }
}

// 클럽 목록 조회
export async function getClubs() {
  try {
    return await client.fetch(
      `*[_type == "club"] | order(name asc) {
        _id,
        name,
        location
      }`,
    );
  } catch (error) {
    console.error('클럽 목록 조회 실패:', error);
    throw new Error('클럽 목록을 불러올 수 없습니다.');
  }
}
