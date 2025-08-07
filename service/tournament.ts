import { client } from '@/sanity/lib/client';
import type { Tournament, TournamentFormData } from '@/model/tournament';

// 대회 목록 조회
export async function getTournaments(): Promise<Tournament[]> {
  const query = `*[_type == "tournament"] | order(_createdAt desc) {
    _id,
    _type,
    title,
    startDate,
    endDate,
    location,
    tournamentType,
    registrationStartDate,
    registrationDeadline,
    descriptionPostId,
    rulesPostId,
    host,
    organizer,
    participants,
    registrationMethod,
    drawMethod,
    equipment,
    memo,
    entryFee,
    bankAccount,
    accountHolder,
    openingCeremony,
    divisions,
    status,
    isDraft,
    createdAt,
    updatedAt,
    createdBy
  }`;

  return client.fetch(query);
}

// 대회 개별 조회
export async function getTournament(id?: string): Promise<Tournament | null> {
  const fields = `
    _id,
    _type,
    title,
    startDate,
    endDate,
    location,
    tournamentType,
    registrationStartDate,
    registrationDeadline,
    descriptionPostId,
    rulesPostId,
    host,
    organizer,
    participants,
    registrationMethod,
    drawMethod,
    equipment,
    memo,
    entryFee,
    bankAccount,
    accountHolder,
    openingCeremony,
    divisions,
    status,
    isDraft,
    createdAt,
    updatedAt,
    createdBy
  `;

  // ID가 없거나 빈 문자열인 경우 최근 등록된 대회 조회
  if (!id || id.trim() === '') {
    const query = `*[_type == "tournament"] | order(createdAt desc)[0] { ${fields} }`;
    return client.fetch(query);
  }

  // 특정 ID로 대회 조회
  const query = `*[_type == "tournament" && _id == $id][0] { ${fields} }`;
  return client.fetch(query, { id });
}

// 대회 생성
export async function createTournament(
  data: TournamentFormData,
  createdBy: string,
): Promise<Tournament> {
  const doc = {
    _type: 'tournament',
    ...data,
    status: 'upcoming',
    isDraft: true, // 기본적으로 임시저장 상태로 생성
    createdAt: new Date().toISOString(),
    createdBy,
  };

  const result = await client.create(doc);
  return result as unknown as Tournament;
}

// 대회 수정
export async function updateTournament(
  id: string,
  data: Partial<TournamentFormData> & { status?: string },
): Promise<Tournament> {
  // 디버깅을 위한 로그
  console.log('업데이트 데이터:', data);
  console.log('개회식 데이터:', data.openingCeremony);

  const updateDoc = {
    ...data,
    updatedAt: new Date().toISOString(),
  };

  const result = await client.patch(id).set(updateDoc).commit();

  return result as unknown as Tournament;
}

// 대회 삭제
export async function deleteTournament(id: string): Promise<void> {
  await client.delete(id);
}

// 대회 상태 업데이트
export async function updateTournamentStatus(
  id: string,
  status: Tournament['status'],
): Promise<Tournament> {
  const result = await client
    .patch(id)
    .set({ status, updatedAt: new Date().toISOString() })
    .commit();

  return result as unknown as Tournament;
}

// 예정된 대회만 조회 (개시된 대회만)
export async function getUpcomingTournaments(): Promise<Tournament[]> {
  const query = `*[_type == "tournament" && status == "upcoming" && isDraft == false] | order(startDate asc) {
    _id,
    _type,
    title,
    startDate,
    endDate,
    location,
    tournamentType,
    registrationStartDate,
    registrationDeadline,
    descriptionPostId,
    rulesPostId,
    host,
    organizer,
    participants,
    registrationMethod,
    drawMethod,
    equipment,
    memo,
    entryFee,
    bankAccount,
    accountHolder,
    openingCeremony,
    divisions,
    status,
    isDraft,
    createdAt,
    updatedAt,
    createdBy
  }`;
  return client.fetch(query);
}

// 관리자용: 예정된 대회 조회 (임시저장 포함)
export async function getUpcomingTournamentsForAdmin(): Promise<Tournament[]> {
  const query = `*[_type == "tournament" && status == "upcoming"] | order(startDate asc) {
    _id,
    _type,
    title,
    startDate,
    endDate,
    location,
    tournamentType,
    registrationStartDate,
    registrationDeadline,
    descriptionPostId,
    rulesPostId,
    host,
    organizer,
    participants,
    registrationMethod,
    drawMethod,
    equipment,
    memo,
    entryFee,
    bankAccount,
    accountHolder,
    openingCeremony,
    divisions,
    status,
    isDraft,
    createdAt,
    updatedAt,
    createdBy
  }`;
  return client.fetch(query);
}
