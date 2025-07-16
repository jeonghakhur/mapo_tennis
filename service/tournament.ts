import { client } from '@/sanity/lib/client';
import type { Tournament, TournamentFormData } from '@/model/tournament';

// 대회 목록 조회
export async function getTournaments(): Promise<Tournament[]> {
  const query = `*[_type == "tournament"] | order(startDate desc) {
    _id,
    _type,
    title,
    startDate,
    endDate,
    location,
    currentParticipants,
    registrationStartDate,
    registrationDeadline,
    descriptionPostId,
    rulesPostId,
    status,
    createdAt,
    updatedAt,
    createdBy
  }`;

  return client.fetch(query);
}

// 대회 개별 조회
export async function getTournament(id: string): Promise<Tournament | null> {
  const query = `*[_type == "tournament" && _id == $id][0] {
    _id,
    _type,
    title,
    startDate,
    endDate,
    location,
    currentParticipants,
    registrationStartDate,
    registrationDeadline,
    descriptionPostId,
    rulesPostId,
    status,
    createdAt,
    updatedAt,
    createdBy
  }`;

  return client.fetch(query, { id });
}

// 대회 생성
export async function createTournament(
  data: TournamentFormData,
  createdBy: string,
): Promise<Tournament> {
  const doc = {
    _type: 'tournament',
    title: data.title,
    startDate: data.startDate,
    endDate: data.endDate,
    location: data.location,
    currentParticipants: 0,
    registrationStartDate: data.registrationStartDate,
    registrationDeadline: data.registrationDeadline,
    descriptionPostId: data.descriptionPostId,
    rulesPostId: data.rulesPostId,
    status: 'upcoming',
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

// 참가자 수 업데이트
export async function updateParticipantCount(
  id: string,
  currentParticipants: number,
): Promise<Tournament> {
  const result = await client
    .patch(id)
    .set({ currentParticipants, updatedAt: new Date().toISOString() })
    .commit();

  return result as unknown as Tournament;
}
