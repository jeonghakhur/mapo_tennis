import { client } from '@/sanity/lib/client';
import type { Club } from '@/model/club';

export async function createClub(club: Omit<Club, '_id' | '_type'>): Promise<Club> {
  const result = await client.create({
    _type: 'club',
    ...club,
  });
  return result as Club;
}

export async function getClubs(): Promise<Club[]> {
  const clubs = await client.fetch(`*[_type == "club"] | order(_createdAt desc)`);
  return clubs as Club[];
}

export async function deleteClub(id: string) {
  return client.delete(id);
}

export async function uploadClubImage(imageFile: File) {
  const asset = await client.assets.upload('image', imageFile, {
    filename: imageFile.name,
    contentType: imageFile.type,
  });
  return asset;
}

export async function updateClub(id: string, updateFields: Record<string, unknown>) {
  // 기존 클럽 정보 조회
  const prevClub = await client.getDocument(id);
  console.log('[updateClub] prevClub:', prevClub);
  // image: null로 변경 요청이 있고, 기존에 이미지가 있으면 asset도 삭제
  if (
    Object.prototype.hasOwnProperty.call(updateFields, 'image') &&
    updateFields.image === null &&
    prevClub?.image?.asset?._ref
  ) {
    console.log('[updateClub] 이미지 asset 삭제 시도:', prevClub.image.asset._ref);
    try {
      await client.delete(prevClub.image.asset._ref);
      console.log('[updateClub] 이미지 asset 삭제 성공:', prevClub.image.asset._ref);
    } catch (err) {
      console.error('[updateClub] 이미지 asset 삭제 실패:', err);
    }
  } else {
    console.log('[updateClub] 이미지 asset 삭제 조건 불충족', {
      hasImageField: Object.prototype.hasOwnProperty.call(updateFields, 'image'),
      imageValue: updateFields.image,
      prevAsset: prevClub?.image?.asset?._ref,
    });
  }
  const patchResult = await client.patch(id).set(updateFields).commit();
  console.log('[updateClub] patch 커밋 결과:', patchResult);
  return patchResult;
}
