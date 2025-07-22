'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Text, TextField, Button, Flex, Badge, Select } from '@radix-ui/themes';
import Container from '@/components/Container';
import LoadingOverlay from '@/components/LoadingOverlay';
import SkeletonCard from '@/components/SkeletonCard';
import { useLoading } from '@/hooks/useLoading';
import { useAdminUsers } from '@/hooks/useAdminUsers';

// clubs의 타입을 명확히 지정
interface ClubWithApproval {
  _id?: string;
  _ref?: string;
  _key?: string;
  name?: string;
  approvedByAdmin?: boolean;
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loading } = useLoading();

  // URL 쿼리 파라미터에서 초기값 가져오기
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [limit] = useState(20);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt');
  const [sortOrder, setSortOrder] = useState(searchParams.get('sortOrder') || 'desc');
  const [showFilter, setShowFilter] = useState(false);

  // 디바운싱된 검색어
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  // 디바운싱 효과
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500); // 500ms 지연

    return () => clearTimeout(timer);
  }, [search]);

  const {
    users,
    pagination,
    error: swrError,
  } = useAdminUsers({ page, limit, search: debouncedSearch, sortBy, sortOrder });

  // 관리자 권한 확인
  useEffect(() => {
    if (status === 'loading') return; // 로딩 중이면 대기

    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (session?.user?.level && session.user.level < 5) {
      router.push('/');
      return;
    }
  }, [session, status, router]);

  // URL 쿼리 파라미터 업데이트 함수
  const updateURL = (newParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    router.push(`/admin/users?${params.toString()}`);
  };

  const handleSearch = () => {
    setPage(1);
    updateURL({ search, page: '1' });
  };

  // 검색어 입력 시 URL 업데이트하지 않음 (디바운싱만 적용)
  const handleSearchInputChange = (value: string) => {
    setSearch(value);
    setPage(1);
    // URL 업데이트는 검색 버튼 클릭 시에만
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateURL({ page: newPage.toString() });
  };

  const handleSortChange = (newSortBy: string, newSortOrder: string) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setPage(1);
    updateURL({ sortBy: newSortBy, sortOrder: newSortOrder, page: '1' });
  };

  // 로딩 중이거나 권한 확인 중일 때
  if (status === 'loading' || (status === 'authenticated' && !session?.user?.level)) {
    return (
      <Container>
        <SkeletonCard lines={4} />
      </Container>
    );
  }

  // 로그인하지 않은 경우
  if (status === 'unauthenticated') {
    return (
      <Container>
        <Box p="5">
          <Text size="5" weight="bold" align="center">
            로그인이 필요합니다.
          </Text>
        </Box>
      </Container>
    );
  }

  // 관리자가 아닌 경우
  if (!session?.user?.level || session.user.level < 5) {
    return (
      <Container>
        <Box p="5">
          <Text size="5" weight="bold" align="center">
            접근 권한이 없습니다.
          </Text>
        </Box>
      </Container>
    );
  }

  return (
    <Container>
      {loading && <LoadingOverlay size="3" />}

      {/* 검색 및 필터 */}
      <Flex gap="3" align="center" wrap="wrap" mb="4">
        <Box style={{ flex: 1, minWidth: '300px' }}>
          <TextField.Root
            placeholder="이름, 클럽명, 점수로 검색"
            value={search}
            onChange={(e) => handleSearchInputChange(e.target.value)}
            size="3"
            style={{ width: '100%' }}
          />
        </Box>
        <Button onClick={() => setShowFilter((prev) => !prev)} size="3" variant="outline">
          필터
        </Button>
        <Button onClick={handleSearch} size="3">
          검색
        </Button>
      </Flex>
      {showFilter && (
        <Flex gap="3" align="center" wrap="wrap" mt="3" mb="4">
          <Text size="3" weight="bold">
            정렬 기준
          </Text>
          <Select.Root
            value={sortBy}
            onValueChange={(value) => handleSortChange(value, sortOrder)}
            size="3"
          >
            <Select.Trigger />
            <Select.Content>
              <Select.Item value="createdAt">가입일</Select.Item>
              <Select.Item value="name">이름</Select.Item>
              <Select.Item value="email">이메일</Select.Item>
              <Select.Item value="level">레벨</Select.Item>
              <Select.Item value="score">점수</Select.Item>
            </Select.Content>
          </Select.Root>
          <Text size="3" weight="bold">
            정렬 순서
          </Text>
          <Select.Root
            value={sortOrder}
            onValueChange={(value) => handleSortChange(sortBy, value)}
            size="3"
          >
            <Select.Trigger />
            <Select.Content>
              <Select.Item value="desc">내림차순</Select.Item>
              <Select.Item value="asc">오름차순</Select.Item>
            </Select.Content>
          </Select.Root>
        </Flex>
      )}

      {/* 회원 목록 */}
      <Text size="4" weight="bold" mb="3" as="div">
        회원 목록 ({pagination.total}명)
      </Text>

      {swrError && (
        <Text color="red" mb="3" size="3">
          {swrError.message}
        </Text>
      )}

      <div className="table-view">
        <table>
          <thead>
            <tr>
              <th>이름</th>
              <th>클럽</th>
              <th>성별</th>
              <th>생년월일</th>
              <th>점수</th>
              <th>회원승인</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user._id}
                onClick={() => router.push(`/admin/users/${user._id}`)}
                style={{ cursor: 'pointer' }}
              >
                <td>{user.name}</td>
                <td>
                  {user.clubs && user.clubs.length > 0 ? (
                    <Flex gap="1" wrap="wrap">
                      {user.clubs.map((club: ClubWithApproval, idx: number) => (
                        <span
                          key={club._key || club._ref || club._id || idx}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <Badge color="blue" variant="soft">
                            {club.name}
                          </Badge>
                        </span>
                      ))}
                    </Flex>
                  ) : (
                    <Text size="2" color="gray">
                      없음
                    </Text>
                  )}
                </td>
                <td>{user.gender}</td>
                <td>{user.birth}</td>
                <td>{user.score}점</td>
                <td>{user.isApprovedUser ? '승인' : '대기'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {pagination.totalPages > 1 && (
        <Flex justify="center" mt="4" gap="2">
          <Button
            variant="outline"
            disabled={pagination.page === 1}
            onClick={() => handlePageChange(pagination.page - 1)}
          >
            이전
          </Button>
          <Text size="3" align="center" style={{ minWidth: '100px', lineHeight: '32px' }}>
            {pagination.page} / {pagination.totalPages}
          </Text>
          <Button
            variant="outline"
            disabled={pagination.page === pagination.totalPages}
            onClick={() => handlePageChange(pagination.page + 1)}
          >
            다음
          </Button>
        </Flex>
      )}
    </Container>
  );
}
