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
  isApprovedUser,
}: Omit<User, '_id' | '_type'> & { clubs?: string[] | ClubRef[] }): Promise<User> {
  try {
    if (!email) throw new Error('email is required');

    const existing = await client.fetch<User>(`*[_type == "user" && email == $email][0]`, {
      email,
    });

    let result;
    if (existing && existing._id) {
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
      if (isApprovedUser !== undefined) {
        updateData.isApprovedUser = isApprovedUser;
      }
      result = await client.patch(existing._id).set(updateData).commit();
    } else if (!existing) {
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
        isApprovedUser: isApprovedUser ?? false,
      };
      result = await client.create(createData);
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
      clubs[]->{
      '_ref': _id,
      _id,
       name,
      }
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

    if (userData.isApprovedUser !== undefined) {
      updateData.isApprovedUser = userData.isApprovedUser;
    }

    const result = await client.patch(id).set(updateData).commit();

    return result as unknown as User;
  } catch (error) {
    console.error('updateUser 오류:', error);
    throw error;
  }
}

export async function setUserApproved(userId: string) {
  return await client.patch(userId).set({ isApprovedUser: true }).commit();
}

// 레벨 4 이상 회원 조회
export async function getUsersLevel4AndAbove(): Promise<User[]> {
  return await client.fetch<User[]>(
    `*[_type == "user" && level >= 4]{ ... } | order(createdAt desc)`,
  );
}

// 회원 탈퇴 (사용자 삭제)
export async function deleteUser(email: string): Promise<void> {
  if (!email) throw new Error('email is required');

  try {
    const user = await getUserByEmail(email);
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }

    if (!user._id) {
      throw new Error('사용자 ID가 없습니다.');
    }

    await client.delete(user._id);
  } catch (error) {
    console.error('deleteUser 오류:', error);
    throw error;
  }
}
