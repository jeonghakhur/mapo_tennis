import { client } from '@/sanity/lib/client';
import type { User } from '../model/user';

export async function upsertUser({
  name,
  phone,
  gender,
  birth,
  score,
  email,
  level,
  address,
}: Omit<User, '_id' | '_type'>): Promise<User> {
  if (!email) throw new Error('email is required');
  const existing = await client.fetch<User>(`*[_type == "user" && email == $email][0]`, { email });
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
    result = await client.patch(existing._id).set(updateData).commit();
  } else if (!existing) {
    // 신규 유저: level을 1로 저장
    result = await client.create({
      _type: 'user',
      name,
      phone,
      gender,
      birth,
      score,
      email,
      level: level || 1,
      address,
    });
  } else {
    throw new Error('기존 유저의 _id가 없습니다.');
  }
  return result as User;
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
