'use client';
import { Award } from '@/model/award';
import { Button, Card, Flex, Badge } from '@radix-ui/themes';
import { Edit, Trash2 } from 'lucide-react';

interface AwardListProps {
  awards: Award[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
  canManage?: boolean;
}

export default function AwardList({
  awards,
  onEdit,
  onDelete,
  isLoading,
  canManage = false,
}: AwardListProps) {
  const getAwardCategoryInfo = (category: string) => {
    switch (category) {
      case '우승':
        return {
          label: '우승',
          color: 'gold' as const,
        };
      case '준우승':
        return {
          label: '준우승',
          color: 'gray' as const,
        };
      case '3위':
        return {
          label: '3위',
          color: 'bronze' as const,
        };
      case '공동3위':
        return {
          label: '공동3위',
          color: 'bronze' as const,
        };
      default:
        return {
          label: category,
          color: 'gray' as const,
        };
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // awards가 배열이 아닌 경우 빈 배열로 처리
  const safeAwards = Array.isArray(awards) ? awards : [];

  // 대회별, 부서별로 그룹화하고 순위별로 정렬하는 함수
  const groupAndSortAwards = (awards: Award[]) => {
    // 대회별로 그룹화
    const groupedAwards = awards.reduce(
      (groups, award) => {
        const key = `${award.competition}-${award.year}`;
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(award);
        return groups;
      },
      {} as Record<string, Award[]>,
    );

    // 각 대회 그룹 내에서 부서별로 다시 그룹화하고 순위별로 정렬
    const processedGroups = Object.entries(groupedAwards).map(
      ([competitionKey, competitionAwards]) => {
        // 부서별로 그룹화
        const divisionGroups = competitionAwards.reduce(
          (groups, award) => {
            if (!groups[award.division]) {
              groups[award.division] = [];
            }
            groups[award.division].push(award);
            return groups;
          },
          {} as Record<string, Award[]>,
        );

        // 각 부서 그룹 내에서 순위별로 정렬
        Object.keys(divisionGroups).forEach((division) => {
          divisionGroups[division].sort((a, b) => {
            const getRankOrder = (category: string) => {
              switch (category) {
                case '우승':
                  return 1;
                case '준우승':
                  return 2;
                case '3위':
                  return 3;
                case '공동3위':
                  return 4;
                default:
                  return 5;
              }
            };

            return getRankOrder(a.awardCategory) - getRankOrder(b.awardCategory);
          });
        });

        // 부서명으로 정렬 (알파벳 순)
        const sortedDivisionGroups = Object.entries(divisionGroups).sort(
          ([divisionA], [divisionB]) => {
            return divisionA.localeCompare(divisionB);
          },
        );

        return [competitionKey, sortedDivisionGroups] as [string, [string, Award[]][]];
      },
    );

    // 연도로 정렬 (최신 연도 우선), 같은 연도면 order 필드로 정렬 (높은 번호가 위로)
    const sortedGroups = processedGroups.sort(([keyA, awardsA], [keyB, awardsB]) => {
      const [, yearA] = keyA.split('-');
      const [, yearB] = keyB.split('-');

      // 연도 비교 (내림차순)
      if (yearA !== yearB) {
        return parseInt(yearB) - parseInt(yearA);
      }

      // 같은 연도면 order 필드로 정렬 (내림차순 - 높은 번호가 위로)
      const maxOrderA = Math.max(
        ...awardsA.flatMap(([, divisionAwards]) => divisionAwards.map((award) => award.order)),
      );
      const maxOrderB = Math.max(
        ...awardsB.flatMap(([, divisionBwards]) => divisionBwards.map((award) => award.order)),
      );

      return maxOrderB - maxOrderA;
    });

    return sortedGroups;
  };

  if (safeAwards.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500">등록된 수상 결과가 없습니다.</p>
      </Card>
    );
  }

  const groupedAwards = groupAndSortAwards(safeAwards);

  return (
    <div className="space-y-8">
      {groupedAwards.map(([competitionKey, divisionGroups]) => {
        const [competition, year] = competitionKey.split('-');

        return (
          <div key={competitionKey} className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800 border-b pb-2">
              {competition} ({year})
            </h2>
            <div className="space-y-4">
              {divisionGroups.map(([division, divisionAwards]) => (
                <div key={division} className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-700 pl-2 border-l-4 border-blue-500">
                    {division}
                  </h3>
                  <div className="space-y-3 pl-4">
                    {divisionAwards.map((award) => {
                      const categoryInfo = getAwardCategoryInfo(award.awardCategory);

                      return (
                        <Card key={award._id} className="p-4">
                          <Flex justify="between" align="start">
                            <div className="flex-1">
                              <Flex align="center" gap="2" mb="2">
                                <Badge color={categoryInfo.color} variant="solid" size="2">
                                  {categoryInfo.label}
                                </Badge>
                              </Flex>

                              <Flex gap="4" wrap="wrap">
                                <p>
                                  <strong>클럽:</strong> {award.club}
                                </p>
                                <p>
                                  <strong>선수:</strong> {award.players.join(', ')}
                                </p>
                              </Flex>
                            </div>

                            {canManage && (
                              <Flex gap="2">
                                <Button size="2" variant="soft" onClick={() => onEdit(award._id)}>
                                  <Edit size={16} />
                                  수정
                                </Button>
                                <Button
                                  size="2"
                                  variant="soft"
                                  color="red"
                                  onClick={() => onDelete(award._id)}
                                >
                                  <Trash2 size={16} />
                                  삭제
                                </Button>
                              </Flex>
                            )}
                          </Flex>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
