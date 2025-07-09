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
}: Omit<User, '_id' | '_type'>): Promise<User> {
  if (!email) throw new Error('email is required');
  const existing = await client.fetch<User>(`*[_type == "user" && email == $email][0]`, { email });
  let result;
  if (existing && existing._id) {
    // 기존 유저: level은 변경하지 않고, 전달된 값만 업데이트
    result = await client
      .patch(existing._id)
      .set({ name, phone, gender, birth, score, level })
      .commit();
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
      level: 1,
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
