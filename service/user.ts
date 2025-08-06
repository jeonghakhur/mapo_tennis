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

// 신규 회원가입 (재가입 포함)
export async function createUser({
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

    // 탈퇴한 사용자 포함하여 모든 사용자 조회
    const existing = await client.fetch<User>(`*[_type == "user" && email == $email][0]`, {
      email,
    });

    if (existing && existing._id) {
      // 재가입 처리
      const isRejoining = existing.isActive === false;

      if (isRejoining) {
        console.log(`재가입: ${email} (이전 탈퇴 사유: ${existing.deactivatedReason})`);
      }

      const updateData: Partial<Omit<User, '_id' | '_type'>> = {
        name,
        phone,
        gender,
        birth,
        score,
        address,
        // 재가입 시 활성 상태로 변경
        isActive: true,
        deactivatedAt: undefined,
        deactivatedReason: undefined,
        // 재가입인 경우 무조건 레벨 1
        level: 1,
      };

      if (clubs !== undefined) {
        updateData.clubs = normalizeClubs(clubs);
      }
      if (isApprovedUser !== undefined) {
        updateData.isApprovedUser = isApprovedUser;
      }

      return (await client.patch(existing._id).set(updateData).commit()) as User;
    } else {
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
        isActive: true,
      };
      return (await client.create(createData)) as User;
    }
  } catch (error) {
    console.error('createUser 오류:', error);
    throw error;
  }
}

// 이메일로 사용자 찾아서 업데이트 (일반 사용자용)
export async function updateUserByEmail(
  email: string,
  userData: Partial<Omit<User, '_id' | '_type'>> & { clubs?: string[] | ClubRef[] },
): Promise<User> {
  try {
    if (!email) throw new Error('email is required');

    const existing = await getUserByEmail(email);
    if (!existing || !existing._id) {
      throw new Error('활성 회원을 찾을 수 없습니다.');
    }

    return await updateUser(existing._id, userData);
  } catch (error) {
    console.error('updateUserByEmail 오류:', error);
    throw error;
  }
}

// 기존 upsertUser 함수 (하위 호환성을 위해 유지)
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

    const existing = await getUserByEmail(email);

    if (existing) {
      // 기존 활성 회원 정보 수정
      return await updateUserByEmail(email, {
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
      });
    } else {
      // 신규 회원가입
      return await createUser({
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
      });
    }
  } catch (error) {
    console.error('upsertUser 오류:', error);
    throw error;
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  if (!email) throw new Error('email is required');
  return await client.fetch<User>(
    `*[_type == "user" && email == $email && isActive != false][0]{
      ...,
    }`,
    { email },
  );
}

export async function getUserById(id: string): Promise<User | null> {
  if (!id) throw new Error('id is required');
  return await client.fetch<User>(
    `*[_type == "user" && _id == $id && isActive != false][0]{
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

// 레벨 4 이상 회원 조회 (활성 사용자만)
export async function getUsersLevel4AndAbove(): Promise<User[]> {
  return await client.fetch<User[]>(
    `*[_type == "user" && level >= 4 && isActive != false]{ ... } | order(createdAt desc)`,
  );
}

// 모든 사용자 조회 (관리자용 - 탈퇴한 사용자 포함)
export async function getAllUsers(): Promise<User[]> {
  return await client.fetch<User[]>(`*[_type == "user"]{ ... } | order(createdAt desc)`);
}

// 회원 탈퇴 (사용자 삭제)
export async function deleteUser(email: string, reason?: string): Promise<void> {
  if (!email) throw new Error('email is required');

  try {
    const user = await getUserByEmail(email);
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }

    if (!user._id) {
      throw new Error('사용자 ID가 없습니다.');
    }

    // 실제 삭제 대신 탈퇴 상태로 업데이트
    await client
      .patch(user._id)
      .set({
        isActive: false,
        deactivatedAt: new Date().toISOString(),
        deactivatedReason: reason || '사용자 요청',
      })
      .commit();
  } catch (error) {
    console.error('deleteUser 오류:', error);
    throw error;
  }
}

// 카카오 액세스 토큰 업데이트
export async function updateUserKakaoToken(email: string, kakaoAccessToken: string): Promise<void> {
  try {
    const user = await getUserByEmail(email);
    if (!user) {
      console.warn(`카카오 토큰 업데이트 실패: 사용자를 찾을 수 없음 (${email})`);
      return;
    }

    await client
      .patch(user._id!)
      .set({
        kakaoAccessToken,
      })
      .commit();
  } catch (error) {
    console.error('updateUserKakaoToken 오류:', error);
  }
}

// 만료된 카카오 액세스 토큰 제거
export async function removeExpiredKakaoToken(userId: string): Promise<void> {
  try {
    await client.patch(userId).unset(['kakaoAccessToken']).commit();
    console.log(`만료된 카카오 토큰 제거: ${userId}`);
  } catch (error) {
    console.error('removeExpiredKakaoToken 오류:', error);
  }
}
