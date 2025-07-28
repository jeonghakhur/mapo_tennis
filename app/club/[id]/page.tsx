'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Flex, AlertDialog, Text } from '@radix-ui/themes';
import Container from '@/components/Container';
import Image from 'next/image';
import { urlFor } from '@/sanity/lib/image';
import { useClub } from '@/hooks/useClubs';
import SkeletonCard from '@/components/SkeletonCard';
import { isHydrating } from '@/lib/isHydrating';
import { useLoading } from '@/hooks/useLoading';
import LoadingOverlay from '@/components/LoadingOverlay';
import { wrapTextWithSpans } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { useClubMembers } from '@/hooks/useClubMembers';
import { useUser } from '@/hooks/useUser';
import type { ClubMember } from '@/model/clubMember';

export default function ClubDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const { club, isLoading, deleteClubById } = useClub(id);
  const [open, setOpen] = useState(false); // AlertDialog open state
  const [deleting, setDeleting] = useState(false);
  const { loading, withLoading } = useLoading();
  const { data: session } = useSession();
  const { user } = useUser(session?.user?.email);
  const { members: allMembers } = useClubMembers();
  const clubMembers = allMembers.filter((m) => {
    if (!club || !m.club) return false;
    if ('_id' in m.club) {
      return m.club._id === club._id;
    }
    if ('_ref' in m.club) {
      return m.club._ref === club._id;
    }
    return false;
  }) as unknown as ClubMember[];

  // 내가 가입한 클럽인지 체크
  let isMyClub = false;
  if (user?.clubs && club?._id) {
    isMyClub = user.clubs.some((c) => c._ref === club._id);
  }

  // 내 역할 찾기
  let myRole: string | undefined = undefined;
  if (isMyClub && session?.user?.name) {
    const myMember = clubMembers.find((m) => m.user === session.user.name);
    myRole = myMember?.role;
  }

  // 권한 체크: 4레벨 이상 또는 내가 가입한 클럽에서 회장/총무
  let canEdit = false;
  let canDelete = false;
  if (session?.user) {
    const userLevel = session.user.level ?? 0;
    if (userLevel >= 4) {
      canEdit = true;
      canDelete = true;
    } else if (isMyClub && (myRole === '회장' || myRole === '총무')) {
      canEdit = true;
    }
  }

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await withLoading(() => deleteClubById());
      router.push('/club');
    } catch (e) {
      alert(e instanceof Error ? e.message : '삭제에 실패했습니다.');
    }
    setDeleting(false);
    // setOpen(false);
  };

  const hydrating = isHydrating(isLoading, club);

  return (
    <Container>
      {hydrating ? (
        <SkeletonCard lines={4} />
      ) : (
        <>
          {loading && <LoadingOverlay size="3" />}
          {canEdit && (
            <div>
              <Text as="div">
                클럽수정 및 회원추가, 수정, 삭제 기능은 클럽의 회장, 총무만 보여지게 됩니다.
              </Text>
              <Flex gap="3" justify="end" mt="4">
                {canDelete && (
                  <AlertDialog.Root open={open} onOpenChange={setOpen}>
                    <AlertDialog.Trigger>
                      <Button size="3" color="red" variant="soft" disabled={deleting}>
                        삭제
                      </Button>
                    </AlertDialog.Trigger>
                    <AlertDialog.Content>
                      <AlertDialog.Title>클럽 삭제</AlertDialog.Title>
                      <AlertDialog.Description>
                        정말로 이 클럽을 삭제하시겠습니까?
                      </AlertDialog.Description>
                      <Flex gap="3" mt="4" justify="end">
                        <AlertDialog.Cancel>
                          <Button variant="soft" color="gray">
                            취소
                          </Button>
                        </AlertDialog.Cancel>
                        <AlertDialog.Action>
                          <Button color="red" onClick={handleDelete} loading={deleting}>
                            삭제
                          </Button>
                        </AlertDialog.Action>
                      </Flex>
                    </AlertDialog.Content>
                  </AlertDialog.Root>
                )}
                <Button size="3" color="blue" onClick={() => router.push(`/club/${id}/edit`)}>
                  수정
                </Button>
                {club && (
                  <Button
                    size="3"
                    color="blue"
                    onClick={() => router.push(`/club-member/create?pageFrom=club&id=${club._id}`)}
                  >
                    회원 추가
                  </Button>
                )}
              </Flex>
            </div>
          )}
          {club && (
            <div className="table-view">
              <div className="my-4">
                {club.image?.asset?._ref && (
                  <Image
                    src={urlFor(club.image).url()}
                    alt={club.name}
                    width={800}
                    height={600}
                    style={{
                      borderRadius: 12,
                      objectFit: 'contain',
                    }}
                  />
                )}
              </div>
              <table>
                <tbody>
                  <tr>
                    <th style={{ width: '100px' }}>
                      <Flex justify="between" align="center" flexGrow="1">
                        {wrapTextWithSpans('클럽명')}
                      </Flex>
                    </th>
                    <td>{club.name}</td>
                  </tr>
                  <tr>
                    <th>
                      <Flex justify="between" align="center" flexGrow="1">
                        {wrapTextWithSpans('소개')}
                      </Flex>
                    </th>
                    <td className="!whitespace-normal">{club.description}</td>
                  </tr>
                  <tr>
                    <th>
                      <Flex justify="between" align="center" flexGrow="1">
                        {wrapTextWithSpans('장소')}
                      </Flex>
                    </th>
                    <td>{club.location}</td>
                  </tr>
                  <tr>
                    <th>
                      <Flex justify="between" align="center" flexGrow="1">
                        {wrapTextWithSpans('운동일')}
                      </Flex>
                    </th>
                    <td>{club.workDays}</td>
                  </tr>
                  <tr>
                    <th>
                      <Flex justify="between" align="center" flexGrow="1">
                        {wrapTextWithSpans('공개여부')}
                      </Flex>
                    </th>
                    <td>{club.isPublic ? '공개' : '비공개'}</td>
                  </tr>
                  <tr>
                    <th>
                      <Flex justify="between" align="center" flexGrow="1">
                        {wrapTextWithSpans('연락처')}
                      </Flex>
                    </th>
                    <td>{club.contact || '-'}</td>
                  </tr>
                </tbody>
              </table>

              {/* 내가 가입한 클럽일 때만 멤버 테이블 노출 */}
              {(isMyClub || (session?.user?.level ?? 0) >= 4) && clubMembers.length > 0 && (
                <div className="table-view mt-6">
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <h2 className="text-xl font-bold mb-2">클럽 멤버</h2>
                  </div>
                  <table className="text-center">
                    <thead>
                      <tr>
                        <th>회원명</th>
                        <th>회원롤</th>
                        <th>나이</th>
                        <th>점수</th>
                        <th>성별</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clubMembers
                        .slice()
                        .sort((a, b) => {
                          const roleOrder = ['회장', '부회장', '총무'];
                          const aRoleIdx = roleOrder.indexOf(a.role || '');
                          const bRoleIdx = roleOrder.indexOf(b.role || '');
                          if (aRoleIdx !== -1 && bRoleIdx !== -1) return aRoleIdx - bRoleIdx;
                          if (aRoleIdx !== -1) return -1;
                          if (bRoleIdx !== -1) return 1;
                          // 나머지는 한글 가나다순
                          return (a.user || '').localeCompare(b.user || '', 'ko');
                        })
                        .map((member) => {
                          // 나이 계산 (출생년도 4자리)
                          let age = '';
                          if (member.birth && /^\d{4}/.test(member.birth)) {
                            const birthYear = parseInt(member.birth.slice(0, 4), 10);
                            if (!isNaN(birthYear)) {
                              age = (new Date().getFullYear() - birthYear + 1).toString();
                            }
                          }
                          const userLevel = session?.user?.level ?? 0;
                          const isManager =
                            myRole === '회장' || myRole === '총무' || userLevel >= 4;
                          const hasId = typeof member._id === 'string' && !!member._id;
                          const rowKey = hasId
                            ? member._id
                            : member.user + '-' + (member.role || '');
                          const rowProps =
                            isManager && hasId
                              ? {
                                  style: { cursor: 'pointer' },
                                  onClick: () => router.push(`/club-member/${member._id}/edit`),
                                }
                              : {};
                          return (
                            <tr key={rowKey} {...rowProps}>
                              <td>{member.user}</td>
                              <td>{member.role || '-'}</td>
                              <td>{age}</td>
                              <td>{member.score ?? '-'}</td>
                              <td>{member.gender || '-'}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </Container>
  );
}
