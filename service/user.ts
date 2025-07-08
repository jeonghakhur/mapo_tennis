import { client } from '@/sanity/lib/client';
import type { User } from '../model/user';

export async function upsertUser({
  name,
  phone,
  gender,
  birth,
  score,
  email,
}: Omit<User, '_id' | '_type' | 'level'>): Promise<User> {
  if (!email) throw new Error('email is required');
  const existing = await client.fetch<User>(`*[_type == "user" && email == $email][0]`, { email });
  let result;
  if (existing && existing._id) {
    result = await client.patch(existing._id).set({ name, phone, gender, birth, score }).commit();
  } else if (!existing) {
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
  return await client.fetch<User>(`*[_type == "user" && email == $email][0]`, { email });
}
