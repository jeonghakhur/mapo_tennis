import useSWR from 'swr';
import type { ClubMemberInput, ClubMember } from '@/model/clubMember';

// 클럽회원 전체 목록 조회 훅
export function useClubMembers() {
  const { data, error, isLoading, mutate } = useSWR<{ members: ClubMemberInput[] }>(
    '/api/club-member',
  );

  return {
    members: data?.members ?? [],
    isLoading,
    error,
    mutate,
  };
}

// 클럽회원 단일 정보 조회 훅
export function useClubMember(id: string) {
  const { data, error, isLoading, mutate } = useSWR<{ member: ClubMember }>(
    id ? `/api/club-member?id=${id}` : null,
  );

  return {
    member: data?.member,
    isLoading,
    error,
    mutate,
  };
}

// 클럽회원 생성 API 요청 함수
export async function createClubMemberRequest(memberData: ClubMemberInput) {
  const res = await fetch('/api/club-member', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(memberData),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || '회원 생성 실패');
  return data;
}

// 클럽회원 수정 API 요청 함수
export async function updateClubMemberRequest(id: string, updateData: Partial<ClubMemberInput>) {
  const res = await fetch(`/api/club-member?id=${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || '회원 수정 실패');
  return data;
}

// 클럽회원 삭제 API 요청 함수
export async function deleteClubMemberRequest(id: string) {
  const res = await fetch(`/api/club-member?id=${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || '회원 삭제 실패');
  return data;
}

// 클럽회원 전체 삭제 API 요청 함수
export async function deleteAllClubMembersRequest() {
  const res = await fetch('/api/club-member', { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || '전체 삭제 실패');
  return data;
}
