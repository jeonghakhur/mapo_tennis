import { client } from '@/sanity/lib/client';
import type { Club } from '@/model/club';

export async function createClub(club: Omit<Club, '_id' | '_type'>): Promise<Club> {
  // image는 assetRef로 변환되어야 함(여기선 그대로 저장)
  const result = await client.create({
    _type: 'club',
    ...club,
  });
  return result as Club;
}
