import { client } from '@/sanity/lib/client';
import type { ClubMember, ClubMemberInput } from '@/model/clubMember';

export async function getClubMembers(): Promise<ClubMember[]> {
  return await client.fetch(
    `*[_type == "clubMember"] | order(club->name asc){
      ...,
      club->{_id, name}
    }`,
  );
}

export async function getClubMember(id: string): Promise<ClubMember | null> {
  if (!id) return null;
  return await client.fetch(
    `*[_type == "clubMember" && _id == $id][0]{
      ...,
      club->{_id, name}
    }`,
    { id },
  );
}

export async function getClubMemberByUserAndClub(
  user: string,
  clubId: string,
): Promise<ClubMember | null> {
  return await client.fetch(
    `*[_type == "clubMember" && user == $user && club._ref == $clubId][0]{
      ...,
      club->{_id, name}
    }`,
    { user, clubId },
  );
}

export async function createClubMember(data: ClubMemberInput) {
  return await client.create({ _type: 'clubMember', ...data });
}

export async function updateClubMember(id: string, updateFields: Partial<ClubMemberInput>) {
  await client.patch(id).set(updateFields).commit();

  // 업데이트 후 확장된 정보로 다시 조회
  return await getClubMember(id);
}

export async function deleteClubMember(id: string) {
  return await client.delete(id);
}

// 클럽회원 전체 삭제 (배치)
export async function deleteAllClubMembers() {
  // Sanity의 delete({ query }) 사용
  return await client.delete({ query: '*[_type == "clubMember"]' });
}

export async function approveClubMemberByAdmin({
  user,
  clubId,
  email,
  phone,
  gender,
  birth,
  score,
}: {
  user: string;
  clubId: string;
  email?: string;
  phone?: string;
  gender?: string;
  birth?: string;
  score?: number;
}) {
  // clubMember가 있는지 확인
  const existing = await client.fetch(
    `*[_type == "clubMember" && user == $user && club._ref == $clubId][0]{ _id }`,
    { user, clubId },
  );
  const updateFields = {
    status: '정회원',
    approvedByAdmin: true,
    email,
    contact: phone,
    gender,
    birth,
    score,
    user,
  };
  let clubMemberResult;
  if (existing && existing._id) {
    // 있으면 모든 필드 업데이트
    clubMemberResult = await updateClubMember(existing._id, updateFields);
  } else {
    // 없으면 새로 생성
    clubMemberResult = await createClubMember({
      user,
      club: { _ref: clubId, _type: 'reference' },
      status: '정회원',
      approvedByAdmin: true,
      email,
      contact: phone,
      gender,
      birth,
      score,
    });
  }
  // userId가 있으면 user 문서도 승인 처리 - 제거됨
  // if (userId) {
  //   await setUserApproved(userId);
  // }
  return clubMemberResult;
}
