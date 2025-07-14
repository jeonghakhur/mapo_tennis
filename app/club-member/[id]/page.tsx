'use client';
import { Text, Button, Flex, Table } from '@radix-ui/themes';
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
        <div>
          {loading && <LoadingOverlay size="3" />}
          <Text size="6" weight="bold" mb="4" as="div">
            클럽회원 상세
          </Text>
          <Table.Root size="3" className="text-lg" mb="5">
            <Table.Body>
              <Table.Row>
                <Table.RowHeaderCell width="100px">이름</Table.RowHeaderCell>
                <Table.Cell>{member.user || '-'}</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.RowHeaderCell>클럽</Table.RowHeaderCell>
                <Table.Cell>{member.club?.name || '-'}</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.RowHeaderCell>직위</Table.RowHeaderCell>
                <Table.Cell>{member.role || '-'}</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.RowHeaderCell>성별</Table.RowHeaderCell>
                <Table.Cell>{member.gender || '-'}</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.RowHeaderCell>연락처</Table.RowHeaderCell>
                <Table.Cell>{member.contact || '-'}</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.RowHeaderCell>출생년도</Table.RowHeaderCell>
                <Table.Cell>{member.birth || '-'}</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.RowHeaderCell>입문년도</Table.RowHeaderCell>
                <Table.Cell>{member.tennisStartYear || '-'}</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.RowHeaderCell>이메일</Table.RowHeaderCell>
                <Table.Cell>{member.email || '-'}</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.RowHeaderCell>점수</Table.RowHeaderCell>
                <Table.Cell>{member.score ?? '-'}</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.RowHeaderCell>회원상태</Table.RowHeaderCell>
                <Table.Cell>{member.status || '-'}</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.RowHeaderCell>가입일</Table.RowHeaderCell>
                <Table.Cell>{member.joinedAt || '-'}</Table.Cell>
              </Table.Row>
              {member.status === '탈퇴회원' && (
                <Table.Row>
                  <Table.RowHeaderCell>탈퇴일</Table.RowHeaderCell>
                  <Table.Cell>{member.leftAt || '-'}</Table.Cell>
                </Table.Row>
              )}
              <Table.Row>
                <Table.RowHeaderCell>메모</Table.RowHeaderCell>
                <Table.Cell>{member.memo || '-'}</Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table.Root>

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
