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

export async function createClubMember(data: ClubMemberInput) {
  return await client.create({ _type: 'clubMember', ...data });
}

export async function updateClubMember(id: string, updateFields: Partial<ClubMemberInput>) {
  console.log(id, updateFields);
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
