'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Box, Text, Button, Flex, Card, Heading, Badge } from '@radix-ui/themes';
import { useLoading } from '@/hooks/useLoading';
import Container from '@/components/Container';

interface GroupingItem {
  tournamentId: string;
  division: string;
  tournamentTitle: string;
  count: number;
  updatedAt: string;
}

export default function TournamentGroupingListPage() {
  const router = useRouter();
  const { loading, withLoading } = useLoading();

  const [groupings, setGroupings] = useState<GroupingItem[]>([]);

  // 조편성 목록 조회
  const fetchGroupings = async () => {
    return withLoading(async () => {
      const response = await fetch('/api/tournament-grouping/index');
      if (response.ok) {
        const data = await response.json();
        setGroupings(data.groupings || []);
      } else {
        console.error('조편성 목록 조회 실패');
      }
    });
  };

  useEffect(() => {
    fetchGroupings();
  }, []);

  // 새 조편성 생성 페이지로 이동
  const handleCreateNew = () => {
    router.push('/tournament-grouping/new');
  };

  // 조편성 상세 페이지로 이동
  const handleViewDetail = (tournamentId: string, division: string) => {
    router.push(`/tournament-grouping/${tournamentId}/${division}`);
  };

  // 부서명 변환
  const getDivisionLabel = (division: string) => {
    const divisionMap: Record<string, string> = {
      master: '마스터부',
      challenger: '챌린저부',
      futures: '퓨처스부',
      forsythia: '개나리부',
      chrysanthemum: '국화부',
    };
    return divisionMap[division] || division;
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Container>
      <Box mb="6">
        <Flex align="center" justify="between" mb="4">
          <Box>
            <Heading size="5" weight="bold" mb="2">
              조편성 관리
            </Heading>
            <Text size="3" color="gray">
              생성된 조편성을 확인하고 관리합니다.
            </Text>
          </Box>
          <Button size="3" onClick={handleCreateNew}>
            새 조편성 생성
          </Button>
        </Flex>
      </Box>

      {loading ? (
        <Card>
          <Box p="6" style={{ textAlign: 'center' }}>
            <Text size="3" color="gray">
              조편성 목록을 불러오는 중...
            </Text>
          </Box>
        </Card>
      ) : groupings.length === 0 ? (
        <Card>
          <Box p="6" style={{ textAlign: 'center' }}>
            <Text size="3" color="gray" mb="4">
              생성된 조편성이 없습니다.
            </Text>
            <Button size="3" onClick={handleCreateNew}>
              첫 조편성 생성하기
            </Button>
          </Box>
        </Card>
      ) : (
        <Flex direction="column" gap="3">
          {groupings.map((grouping) => (
            <Card
              key={`${grouping.tournamentId}__${grouping.division}`}
              style={{ cursor: 'pointer' }}
              onClick={() => handleViewDetail(grouping.tournamentId, grouping.division)}
            >
              <Box p="4">
                <Flex align="center" justify="between">
                  <Box>
                    <Flex align="center" gap="2" mb="2">
                      <Text size="4" weight="bold">
                        {grouping.tournamentTitle}
                      </Text>
                      <Text size="3" color="gray">
                        ·
                      </Text>
                      <Text size="4" weight="bold">
                        {getDivisionLabel(grouping.division)}
                      </Text>
                    </Flex>
                    <Text size="2" color="gray">
                      {formatDate(grouping.updatedAt)}
                    </Text>
                  </Box>
                  <Flex align="center" gap="2">
                    <Badge color="blue" size="2">
                      {grouping.count}개 조
                    </Badge>
                    <Text size="2" color="gray">
                      →
                    </Text>
                  </Flex>
                </Flex>
              </Box>
            </Card>
          ))}
        </Flex>
      )}
    </Container>
  );
}
