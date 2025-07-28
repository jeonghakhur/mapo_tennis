'use client';
import { Text, Button, Flex } from '@radix-ui/themes';
import { useLoading } from '@/hooks/useLoading';
import LoadingOverlay from '@/components/LoadingOverlay';
import Link from 'next/link';
import { useClubMember } from '@/hooks/useClubMembers';
import React from 'react';
import Container from '@/components/Container';
import SkeletonCard from '@/components/SkeletonCard';

export default function ClubMemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { member, isLoading, error } = useClubMember(id);
  const { loading } = useLoading();

  return (
    <Container>
      {isLoading ? (
        <SkeletonCard />
      ) : error ? (
        <Text color="red">회원 정보를 불러오지 못했습니다.</Text>
      ) : !member ? (
        <Text color="gray">회원 정보를 찾을 수 없습니다.</Text>
      ) : (
        <div className="table-view">
          {loading && <LoadingOverlay size="3" />}

          <table>
            <tbody>
              <tr>
                <th style={{ width: '100px' }}>이름</th>
                <td>{member.user || '-'}</td>
              </tr>
              <tr>
                <th>클럽</th>
                <td>{member.club?.name || '-'}</td>
              </tr>
              <tr>
                <th>직위</th>
                <td>{member.role || '-'}</td>
              </tr>
              <tr>
                <th>성별</th>
                <td>{member.gender || '-'}</td>
              </tr>
              <tr>
                <th>연락처</th>
                <td>{member.contact || '-'}</td>
              </tr>
              <tr>
                <th>출생년도</th>
                <td>{member.birth || '-'}</td>
              </tr>
              <tr>
                <th>입문년도</th>
                <td>{member.tennisStartYear || '-'}</td>
              </tr>
              <tr>
                <th>이메일</th>
                <td>{member.email || '-'}</td>
              </tr>
              <tr>
                <th>점수</th>
                <td>{member.score ?? '-'}</td>
              </tr>
              <tr>
                <th>회원상태</th>
                <td>{member.status || '-'}</td>
              </tr>
              <tr>
                <th>가입일</th>
                <td>{member.joinedAt || '-'}</td>
              </tr>
              {member.status === '탈퇴회원' && (
                <tr>
                  <th>탈퇴일</th>
                  <td>{member.leftAt || '-'}</td>
                </tr>
              )}
              <tr>
                <th>메모</th>
                <td>{member.memo || '-'}</td>
              </tr>
            </tbody>
          </table>

          <Flex gap="2">
            <Button asChild size="3" className="!flex-1">
              <Link href={`/club-member/${id}/edit`}>수정</Link>
            </Button>
            <Button asChild variant="soft" size="3" className="!flex-1">
              <Link href="/club-member">목록으로</Link>
            </Button>
          </Flex>
        </div>
      )}
    </Container>
  );
}
