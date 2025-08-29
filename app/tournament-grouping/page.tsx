'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Box, Text, Button, Flex, Card, Heading, Badge } from '@radix-ui/themes';
import Container from '@/components/Container';
import { useTournamentGroupings } from '@/hooks/useTournamentGroupings';
import { useUser } from '@/hooks/useUser';
import { isAdmin } from '@/lib/authUtils';

export default function TournamentGroupingListPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { user } = useUser(session?.user?.email);
  const { groupings, isLoading, error, mutate } = useTournamentGroupings();
  const [groupingStatus, setGroupingStatus] = useState<
    Record<string, { hasMatches: boolean; hasBracket: boolean }>
  >({});

  // 관리자 권한 확인
  const admin = isAdmin(user);

  // 새 조편성 생성 페이지로 이동
  const handleCreateNew = () => {
    router.push('/tournament-grouping/new');
  };

  // 조편성 상세 페이지로 이동
  const handleViewDetail = (tournamentId: string, division: string) => {
    router.push(`/tournament-grouping/${tournamentId}/${division}`);
  };

  // 예선 경기 상세 페이지로 이동
  const handleViewMatches = (tournamentId: string, division: string) => {
    router.push(`/tournament-grouping/matches?tournamentId=${tournamentId}&division=${division}`);
  };

  // 본선 대진표 상세 페이지로 이동
  const handleViewBracket = (tournamentId: string, division: string) => {
    router.push(
      `/tournament-grouping/bracket/view?tournamentId=${tournamentId}&division=${division}`,
    );
  };

  // 예선 경기와 본선 대진표 존재 여부 확인
  const checkGroupingStatus = useCallback(async (tournamentId: string, division: string) => {
    const key = `${tournamentId}__${division}`;

    try {
      // 예선 경기 확인
      const matchesResponse = await fetch(
        `/api/tournament-grouping/matches?tournamentId=${tournamentId}&division=${division}`,
      );
      const hasMatches = matchesResponse.ok;

      // 본선 대진표 확인
      const bracketResponse = await fetch(
        `/api/tournament-grouping/bracket?tournamentId=${tournamentId}&division=${division}`,
      );
      let hasBracket = false;
      if (bracketResponse.ok) {
        const bracketData = await bracketResponse.json();
        hasBracket = bracketData.matches && bracketData.matches.length > 0;
      }

      setGroupingStatus((prev) => ({
        ...prev,
        [key]: { hasMatches, hasBracket },
      }));
    } catch (error) {
      console.error('조편성 상태 확인 오류:', error);
      setGroupingStatus((prev) => ({
        ...prev,
        [key]: { hasMatches: false, hasBracket: false },
      }));
    }
  }, []);

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

  // 조편성 목록이 로드될 때 각 조편성의 상태 확인
  useEffect(() => {
    if (groupings.length > 0) {
      groupings.forEach((grouping) => {
        checkGroupingStatus(grouping.tournamentId, grouping.division);
      });
    }
  }, [groupings, checkGroupingStatus]);

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
          {admin && (
            <Button size="3" onClick={handleCreateNew}>
              새 조편성 생성
            </Button>
          )}
        </Flex>
      </Box>

      {isLoading ? (
        <Card>
          <Box p="6" style={{ textAlign: 'center' }}>
            <Text size="3" color="gray">
              조편성 목록을 불러오는 중...
            </Text>
          </Box>
        </Card>
      ) : error ? (
        <Card>
          <Box p="6" style={{ textAlign: 'center' }}>
            <Text size="3" color="red" mb="4">
              조편성 목록 조회에 실패했습니다.
            </Text>
            <Button size="3" onClick={() => mutate()}>
              다시 시도
            </Button>
          </Box>
        </Card>
      ) : (
        <Flex direction="column" gap="3">
          {groupings.map((grouping) => (
            <Card key={`${grouping.tournamentId}__${grouping.division}`}>
              <Box p="4">
                <Flex align="center" justify="between" mb="3">
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
                  </Flex>
                </Flex>

                {/* 버튼 영역 */}
                <Flex gap="2" wrap="wrap">
                  <Button
                    size="2"
                    variant="soft"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetail(grouping.tournamentId, grouping.division);
                    }}
                  >
                    조편성 상세
                  </Button>

                  {groupingStatus[`${grouping.tournamentId}__${grouping.division}`]?.hasMatches && (
                    <Button
                      size="2"
                      color="orange"
                      variant="soft"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewMatches(grouping.tournamentId, grouping.division);
                      }}
                    >
                      예선 경기
                    </Button>
                  )}

                  {groupingStatus[`${grouping.tournamentId}__${grouping.division}`]?.hasBracket && (
                    <Button
                      size="2"
                      color="green"
                      variant="soft"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewBracket(grouping.tournamentId, grouping.division);
                      }}
                    >
                      본선 대진표
                    </Button>
                  )}
                </Flex>
              </Box>
            </Card>
          ))}
        </Flex>
      )}
    </Container>
  );
}
