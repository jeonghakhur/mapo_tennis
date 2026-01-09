'use client';
import {
  Box,
  Text,
  Button,
  Flex,
  Select,
  TextField,
  Dialog,
  IconButton,
  Checkbox,
} from '@radix-ui/themes';
// import { useClubMembers, deleteAllClubMembersRequest } from '@/hooks/useClubMembers';
import { useClubMembers } from '@/hooks/useClubMembers';
import type { ClubMember, ClubMemberInput } from '@/model/clubMember';
import { useState, useMemo } from 'react';
import { useLoading } from '@/hooks/useLoading';
import LoadingOverlay from '@/components/LoadingOverlay';
import SkeletonCard from '@/components/SkeletonCard';
import Container from '@/components/Container';
import { useRouter } from 'next/navigation';
import { NotebookPen, SlidersHorizontal } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useUser } from '@/hooks/useUser';
import { hasPermissionLevel } from '@/lib/authUtils';
import { Combobox } from '@/components/ui/combobox';

export default function ClubMemberListPage() {
  const { data: session } = useSession();
  const { user } = useUser(session?.user?.email);
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

  function formatPhoneNumber(phone?: string) {
    if (!phone) return '-';

    // 특수 제어 문자와 숫자가 아닌 문자 제거
    const numbers = phone.replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069\D]/g, '');

    // 11자리 휴대폰 번호인 경우
    if (numbers.length === 11 && numbers.startsWith('010')) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
    }

    // 10자리 휴대폰 번호인 경우 (010으로 시작)
    if (numbers.length === 10 && numbers.startsWith('010')) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`;
    }

    // 다른 형식의 번호는 원본 반환
    return phone;
  }

  function formatDate(dateString?: string) {
    if (!dateString) return '-';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';

      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch {
      return '-';
    }
  }

  // 권한 체크 (레벨 4 이상)
  if (session && !hasPermissionLevel(user, 4)) {
    return (
      <Container>
        <Box>
          <Text color="red" size="4" weight="bold">
            접근 권한이 없습니다.
          </Text>
          <Text color="gray" size="3" style={{ marginTop: '8px' }}>
            클럽멤버 페이지는 레벨 4 이상의 사용자만 접근할 수 있습니다.
          </Text>
        </Box>
      </Container>
    );
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

            <Combobox
              options={[
                { value: 'ALL', label: '전체' },
                ...clubOptions.map((name) => ({ value: name, label: name })),
              ]}
              value={selectedClub}
              onValueChange={setSelectedClub}
              placeholder="클럽명으로 필터링"
              className="flex-1"
            />
            <IconButton
              onClick={() => setFilterOpen(true)}
              variant="soft"
              size="3"
              aria-label="고급 필터"
            >
              <SlidersHorizontal />
            </IconButton>
          </Flex>
          <div
            style={{
              position: 'fixed',
              bottom: '20px',
              right: '20px',
              zIndex: 1000,
            }}
          >
            <Button
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={() => router.push(`/club-member/create`)}
            >
              <NotebookPen size={24} />
            </Button>
          </div>
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
                      checked={roleFilter.includes('대의원')}
                      onCheckedChange={(checked) => {
                        setRoleFilter((prev) =>
                          checked ? [...prev, '대의원'] : prev.filter((r) => r !== '대의원'),
                        );
                      }}
                      id="role-delegate"
                    />
                    <label htmlFor="role-delegate">대의원</label>
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
          <div className="table-view">
            <table>
              <thead>
                <tr>
                  <th>순번</th>
                  <th>클럽</th>
                  <th>이름</th>
                  <th>직위</th>
                  <th>나이</th>
                  <th>점수</th>
                  <th>성별</th>
                  <th>회원상태</th>
                  <th>회원등록일</th>
                  {hasPermissionLevel(user, 5) && <th>전화번호</th>}
                </tr>
              </thead>
              <tbody>
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
                      <tr
                        key={id}
                        onClick={() => router.push(`/club-member/${(m as ClubMember)._id || ''}`)}
                      >
                        <td>{idx + 1}</td>
                        <td>{m.club && 'name' in m.club ? m.club.name : '-'}</td>
                        <td>{m.user}</td>
                        <td>{m.role || '-'}</td>
                        <td>{getAge(m.birth)}</td>
                        <td>{m.score || '-'}</td>
                        <td>{m.gender || '-'}</td>
                        <td>{m.status || '-'}</td>
                        <td>{formatDate('_createdAt' in m ? m._createdAt : undefined)}</td>
                        {hasPermissionLevel(user, 5) && <td>{formatPhoneNumber(m.contact)}</td>}
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </Box>
      )}
    </Container>
  );
}
