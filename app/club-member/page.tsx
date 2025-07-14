'use client';
import {
  Box,
  Text,
  Button,
  Table,
  Flex,
  Select,
  TextField,
  Dialog,
  IconButton,
  Checkbox,
} from '@radix-ui/themes';
import Link from 'next/link';
// import { useClubMembers, deleteAllClubMembersRequest } from '@/hooks/useClubMembers';
import { useClubMembers } from '@/hooks/useClubMembers';
import type { ClubMember, ClubMemberInput } from '@/model/clubMember';
import { useState, useMemo } from 'react';
import { useLoading } from '@/hooks/useLoading';
import LoadingOverlay from '@/components/LoadingOverlay';
import SkeletonCard from '@/components/SkeletonCard';
import Container from '@/components/Container';
import { useRouter } from 'next/navigation';
import { SlidersHorizontal } from 'lucide-react';

export default function ClubMemberListPage() {
  const { members, isLoading, error } = useClubMembers();
  const [selectedClub, setSelectedClub] = useState<string>('ALL');
  // const [deletingAll, setDeletingAll] = useState(false);
  const [searchUser, setSearchUser] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('ALL');
  const [scoreMin, setScoreMin] = useState('');
  const [scoreMax, setScoreMax] = useState('');
  const [over65, setOver65] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string[]>([]);
  const router = useRouter();
  const { loading } = useLoading();

  // 중복 없는 클럽명 목록 추출
  type MemberType = ClubMember | ClubMemberInput;
  const clubOptions = useMemo(() => {
    const names = (members as MemberType[])
      .map((m) => (m.club && 'name' in m.club ? (m.club.name as string) : undefined))
      .filter((name): name is string => Boolean(name));
    return Array.from(new Set(names));
  }, [members]);

  // 클럽명 필터링 적용
  const filteredMembers = useMemo(() => {
    if (selectedClub === 'ALL') return members;
    return (members as MemberType[]).filter((m) =>
      m.club && 'name' in m.club ? m.club.name === selectedClub : false,
    );
  }, [members, selectedClub]);

  // 회원명 검색 필터 추가
  const filteredMembersByName = useMemo(
    () =>
      (filteredMembers as MemberType[]).filter((m) =>
        m.user.replace(/\s/g, '').includes(searchUser.replace(/\s/g, '')),
      ),
    [filteredMembers, searchUser],
  );

  // 필터 적용
  const filteredMembersFinal = useMemo(
    () =>
      (filteredMembersByName as MemberType[]).filter((m) => {
        const age = getAge(m.birth);
        const genderOk = genderFilter === 'ALL' || !genderFilter || m.gender === genderFilter;
        const scoreOk =
          (!scoreMin || (m.score !== undefined && m.score >= Number(scoreMin))) &&
          (!scoreMax || (m.score !== undefined && m.score <= Number(scoreMax)));
        const over65Ok = !over65 || (typeof age === 'number' && age >= 65);
        return (
          (statusFilter === 'ALL' || !statusFilter || m.status === statusFilter) &&
          (roleFilter.length === 0 || roleFilter.includes(m.role ?? '')) &&
          genderOk &&
          scoreOk &&
          over65Ok
        );
      }),
    [filteredMembersByName, statusFilter, roleFilter, genderFilter, scoreMin, scoreMax, over65],
  );

  // const handleDeleteAll = async () => {
  //   if (!window.confirm('정말 전체 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
  //   setDeletingAll(true);
  //   try {
  //     await deleteAllClubMembersRequest();
  //     // 목록 새로고침
  //     mutate();
  //   } catch (e) {
  //     alert('전체 삭제 실패: ' + (e instanceof Error ? e.message : e));
  //   }
  //   setDeletingAll(false);
  // };

  function getAge(birth?: string) {
    if (!birth || isNaN(Number(birth))) return '-';
    const birthYear = Number(birth);
    const today = new Date();
    const birthDate = new Date(birthYear, 0, 1); // 출생년도 1월 1일로 가정
    let age = today.getFullYear() - birthYear;
    // 만 나이: 올해 생일(1월 1일) 안 지났으면 1살 빼기
    if (
      today.getMonth() < birthDate.getMonth() ||
      (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  }

  return (
    <Container>
      {isLoading ? (
        <SkeletonCard lines={4} />
      ) : error ? (
        <Text color="red">회원 목록을 불러오지 못했습니다.</Text>
      ) : (
        <Box>
          {loading && <LoadingOverlay size="3" />}
          <Flex align="center" justify="between" mb="4">
            <Text size="6" weight="bold">
              클럽회원 목록
            </Text>
            {/* <Button
              color="red"
              variant="soft"
              onClick={() => withLoading(handleDeleteAll)}
              loading={loading}
              size="2"
            >
              전체 삭제
            </Button> */}
          </Flex>
          <Flex align="center" gap="3" mb="4">
            <TextField.Root
              placeholder="회원 이름 검색"
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              size="3"
              style={{ width: 200 }}
            />

            <Select.Root value={selectedClub} onValueChange={setSelectedClub} size="3">
              <Select.Trigger placeholder="클럽명으로 필터링" />
              <Select.Content>
                <Select.Item value="ALL">전체</Select.Item>
                {clubOptions.map((name) => (
                  <Select.Item key={name} value={name}>
                    {name}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
            <IconButton
              onClick={() => setFilterOpen(true)}
              variant="soft"
              size="3"
              aria-label="고급 필터"
            >
              <SlidersHorizontal />
            </IconButton>
            <Button asChild ml="auto" size="3">
              <Link href="/club-member/create">회원 등록</Link>
            </Button>
          </Flex>
          <Dialog.Root open={filterOpen} onOpenChange={setFilterOpen}>
            <Dialog.Content style={{ maxWidth: 400 }}>
              <Dialog.Title>고급 필터</Dialog.Title>
              <Flex direction="column" gap="4" mt="4">
                <Select.Root value={statusFilter} onValueChange={setStatusFilter} size="3">
                  <Select.Trigger placeholder="회원상태" />
                  <Select.Content>
                    <Select.Item value="ALL">전체</Select.Item>
                    <Select.Item value="정회원">정회원</Select.Item>
                    <Select.Item value="휴회원">휴회원</Select.Item>
                    <Select.Item value="탈퇴회원">탈퇴회원</Select.Item>
                  </Select.Content>
                </Select.Root>
                {/* 출생년도 필터 삭제 */}
                <Select.Root value={genderFilter} onValueChange={setGenderFilter} size="3">
                  <Select.Trigger placeholder="성별" />
                  <Select.Content>
                    <Select.Item value="ALL">전체</Select.Item>
                    <Select.Item value="남">남</Select.Item>
                    <Select.Item value="여">여</Select.Item>
                  </Select.Content>
                </Select.Root>
                <Flex gap="2" align="center">
                  <Text size="3">점수</Text>
                  <TextField.Root
                    placeholder="최소"
                    value={scoreMin}
                    onChange={(e) => setScoreMin(e.target.value.replace(/[^0-9]/g, ''))}
                    size="3"
                    style={{ width: 70 }}
                  />
                  <Text size="3">~</Text>
                  <TextField.Root
                    placeholder="최대"
                    value={scoreMax}
                    onChange={(e) => setScoreMax(e.target.value.replace(/[^0-9]/g, ''))}
                    size="3"
                    style={{ width: 70 }}
                  />
                </Flex>
                <Flex gap="2" align="center">
                  <Checkbox
                    checked={over65}
                    onCheckedChange={(checked) => setOver65(!!checked)}
                    id="over65"
                  />
                  <label htmlFor="over65">65세 이상만 보기</label>
                </Flex>
                <Flex direction="column" gap="2">
                  <Text size="3" weight="bold">
                    직위
                  </Text>
                  <Flex gap="3" align="center">
                    <Checkbox
                      checked={roleFilter.includes('회장')}
                      onCheckedChange={(checked) => {
                        setRoleFilter((prev) =>
                          checked ? [...prev, '회장'] : prev.filter((r) => r !== '회장'),
                        );
                      }}
                      id="role-president"
                    />
                    <label htmlFor="role-president">회장</label>
                    <Checkbox
                      checked={roleFilter.includes('총무')}
                      onCheckedChange={(checked) => {
                        setRoleFilter((prev) =>
                          checked ? [...prev, '총무'] : prev.filter((r) => r !== '총무'),
                        );
                      }}
                      id="role-manager"
                    />
                    <label htmlFor="role-manager">총무</label>
                    <Checkbox
                      checked={roleFilter.length === 0}
                      onCheckedChange={(checked) => {
                        if (checked) setRoleFilter([]);
                      }}
                      id="role-all"
                    />
                    <label htmlFor="role-all">전체</label>
                  </Flex>
                </Flex>
                <Button onClick={() => setFilterOpen(false)} mt="3" size="3">
                  닫기
                </Button>
              </Flex>
            </Dialog.Content>
          </Dialog.Root>
          <div className="overflow-x-auto">
            <Table.Root className="whitespace-nowrap">
              <Table.Header>
                <Table.Row className="text-center text-lg">
                  <Table.ColumnHeaderCell>순번</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>클럽</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>이름</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>직위</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>나이</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>점수</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>성별</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>회원상태</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {(filteredMembersFinal as MemberType[])
                  .slice()
                  .sort((a, b) => {
                    const nameA = a.club && 'name' in a.club ? a.club.name : '';
                    const nameB = b.club && 'name' in b.club ? b.club.name : '';
                    return nameA.localeCompare(nameB, 'ko');
                  })
                  .map((m, idx) => {
                    const id = (m as ClubMember)._id || idx;
                    return (
                      <Table.Row
                        key={id}
                        className="text-center hover:bg-gray-100 cursor-pointer text-lg"
                        onClick={() => router.push(`/club-member/${(m as ClubMember)._id || ''}`)}
                      >
                        <Table.Cell>{idx + 1}</Table.Cell>
                        <Table.Cell>{m.club && 'name' in m.club ? m.club.name : '-'}</Table.Cell>
                        <Table.Cell>{m.user}</Table.Cell>
                        <Table.Cell>{m.role || '-'}</Table.Cell>
                        <Table.Cell>{getAge(m.birth)}</Table.Cell>
                        <Table.Cell>{m.score || '-'}</Table.Cell>
                        <Table.Cell>{m.gender || '-'}</Table.Cell>
                        <Table.Cell>{m.status || '-'}</Table.Cell>
                      </Table.Row>
                    );
                  })}
              </Table.Body>
            </Table.Root>
          </div>
        </Box>
      )}
    </Container>
  );
}
