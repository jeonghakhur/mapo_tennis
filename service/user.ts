import { client } from '@/sanity/lib/client';
import type { User } from '../model/user';

type ClubRef = { _key: string; _ref: string };

function normalizeClubs(clubs?: string[] | ClubRef[]): ClubRef[] {
  if (!clubs) return [];
  if (typeof clubs[0] === 'string') {
    return (clubs as string[]).map((id, idx) => ({
      _key: `club_${idx}`,
      _ref: id,
    }));
  }
  return clubs as ClubRef[];
}

export async function upsertUser({
  name,
  phone,
  gender,
  birth,
  score,
  email,
  level,
  address,
  clubs,
}: Omit<User, '_id' | '_type'> & { clubs?: string[] | ClubRef[] }): Promise<User> {
  try {
    console.log('upsertUser 시작:', { email, name });

    if (!email) throw new Error('email is required');

    console.log('기존 사용자 조회 시작');
    const existing = await client.fetch<User>(`*[_type == "user" && email == $email][0]`, {
      email,
    });
    console.log('기존 사용자 조회 결과:', existing);

    let result;
    if (existing && existing._id) {
      console.log('기존 사용자 업데이트 시작');
      // 기존 유저: 전달된 level을 사용하거나 기존 레벨 유지
      const updateData: Partial<Omit<User, '_id' | '_type'>> = {
        name,
        phone,
        gender,
        birth,
        score,
        address,
      };
      if (level !== undefined) {
        updateData.level = level;
      }
      if (clubs !== undefined) {
        updateData.clubs = normalizeClubs(clubs);
      }
      console.log('업데이트 데이터:', updateData);
      result = await client.patch(existing._id).set(updateData).commit();
      console.log('기존 사용자 업데이트 완료:', result);
    } else if (!existing) {
      console.log('신규 사용자 생성 시작');
      // 신규 유저: level을 1로 저장
      const createData = {
        _type: 'user',
        name,
        phone,
        gender,
        birth,
        score,
        email,
        level: level || 1,
        address,
        clubs: clubs ? normalizeClubs(clubs) : [],
      };
      console.log('생성 데이터:', createData);
      result = await client.create(createData);
      console.log('신규 사용자 생성 완료:', result);
    } else {
      throw new Error('기존 유저의 _id가 없습니다.');
    }
    return result as User;
  } catch (error) {
    console.error('upsertUser 오류:', error);
    throw error;
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  if (!email) throw new Error('email is required');
  return await client.fetch<User>(
    `*[_type == "user" && email == $email][0]{
      ...,
    }`,
    { email },
  );
}

export async function getUserById(id: string): Promise<User | null> {
  if (!id) throw new Error('id is required');
  return await client.fetch<User>(
    `*[_type == "user" && _id == $id][0]{
      ...,
    }`,
    { id },
  );
}

export async function updateUser(
  id: string,
  userData: Partial<Omit<User, '_id' | '_type'>> & { clubs?: string[] | ClubRef[] },
): Promise<User> {
  if (!id) throw new Error('id is required');

  try {
    console.log('updateUser 시작:', { id, userData });

    const updateData: Partial<Omit<User, '_id' | '_type' | '_createdAt'>> = {
      name: userData.name,
      phone: userData.phone,
      gender: userData.gender,
      birth: userData.birth,
      score: userData.score,
      email: userData.email,
      level: userData.level,
      address: userData.address,
    };

    if (userData.clubs !== undefined) {
      updateData.clubs = normalizeClubs(userData.clubs);
    }

    console.log('업데이트 데이터:', updateData);
    const result = await client.patch(id).set(updateData).commit();
    console.log('사용자 업데이트 완료:', result);

    return result as unknown as User;
  } catch (error) {
    console.error('updateUser 오류:', error);
    throw error;
  }
}
