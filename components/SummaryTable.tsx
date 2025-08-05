// components/SummaryTable.tsx
import React from 'react';
import { Award } from '@/model/award';
import { Text, Flex, Separator, Box, Badge } from '@radix-ui/themes';

function groupAwardsByCompetitionAndDivision(awards: Award[]) {
  // 대회명+년도 → 부서 → [Award, ...]
  const grouped: Record<string, Record<string, Award[]>> = {};
  awards.forEach((award) => {
    const compYear = `${award.competition}||${award.year}`;
    if (!grouped[compYear]) grouped[compYear] = {};
    if (!grouped[compYear][award.division]) grouped[compYear][award.division] = [];
    grouped[compYear][award.division].push(award);
  });
  return grouped;
}

export default function SummaryTable({ awards }: { awards: Award[] }) {
  const grouped = groupAwardsByCompetitionAndDivision(awards);
  const categoryOrder = ['우승', '준우승', '3위', '공동3위'];
  console.log(grouped);

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

  return (
    <Flex direction="column" gap="4" style={{ width: '100%' }}>
      {Object.entries(grouped).map(([compYear, divisions]) => {
        const [competition, year] = compYear.split('||');
        // 대표 gameType 추출
        const firstDivision = Object.values(divisions)[0];
        const firstAward = firstDivision && firstDivision[0];
        const gameType = firstAward?.gameType;
        return (
          <div key={compYear} className="border border-gray-200 p-4 rounded-md">
            <Text size="5" weight="bold" as="div" mb="2">
              {year} {competition}
              {gameType && (
                <Text as="span" size="3" color="gray" ml="2">
                  ({gameType})
                </Text>
              )}
            </Text>
            <Separator size="4" mb="3" style={{ borderBottomWidth: '2px' }} />
            {/* 이하 division 렌더링 동일 */}
            <div>
              {Object.entries(divisions).map(([division, awardsInDivision], divIdx, arr) => {
                // awardCategory별로 묶기
                const categories = awardsInDivision.reduce(
                  (acc, award) => {
                    if (!acc[award.awardCategory]) acc[award.awardCategory] = [];
                    acc[award.awardCategory].push(award);
                    return acc;
                  },
                  {} as Record<string, Award[]>,
                );
                return (
                  <Box
                    key={division}
                    className={`mb-4 ${divIdx < arr.length - 1 ? 'border-b border-gray-200' : ''}`}
                  >
                    <Text size="4" weight="bold" as="div" mb="2">
                      {division}
                    </Text>
                    <div className="space-y-2">
                      {categoryOrder
                        .filter((cat) => categories[cat])
                        .map((cat) => {
                          const categoryInfo = getAwardCategoryInfo(cat);

                          return (
                            <Flex key={cat} className="mb-4" gap="2">
                              <div className="w-13">
                                <Badge color={categoryInfo.color} variant="solid">
                                  {categoryInfo.label}
                                </Badge>
                              </div>

                              <ul className="flex-1">
                                {cat === '공동3위'
                                  ? (() => {
                                      // 공동3위인 경우 단체전/개인전 구분하여 표시
                                      const isTeamGame = categories[cat][0]?.gameType === '단체전';

                                      return categories[cat].map((award, idx) => (
                                        <li key={cat + idx} className="mb-2">
                                          {isTeamGame ? (
                                            // 단체전: 클럽 → 선수
                                            <>
                                              <div className="flex items-center gap-2">
                                                <Text weight="bold">클럽</Text>
                                                <Separator orientation="vertical" />
                                                <Text>{award.club}</Text>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <Text weight="bold" className="whitespace-nowrap">
                                                  선수
                                                </Text>
                                                <Separator orientation="vertical" />
                                                <Text>{award.players.join(', ')}</Text>
                                              </div>
                                            </>
                                          ) : (
                                            // 개인전: 선수 → 클럽
                                            <>
                                              <div className="flex items-center gap-2">
                                                <Text weight="bold" className="whitespace-nowrap">
                                                  선수
                                                </Text>
                                                <Separator orientation="vertical" />
                                                <Text>{award.players.join(', ')}</Text>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <Text weight="bold">클럽</Text>
                                                <Separator orientation="vertical" />
                                                <Text>{award.club}</Text>
                                              </div>
                                            </>
                                          )}
                                        </li>
                                      ));
                                    })()
                                  : categories[cat][0]?.gameType === '단체전'
                                    ? (() => {
                                        const clubs = Array.from(
                                          new Set(categories[cat].map((a) => a.club)),
                                        );
                                        const allPlayers = Array.from(
                                          new Set(categories[cat].flatMap((a) => a.players)),
                                        );
                                        return [
                                          <Flex key={cat + 'clubs'} align="center" gap="2">
                                            <Text weight="bold">클럽</Text>
                                            <Separator orientation="vertical" />
                                            <Text>{clubs.join(', ')}</Text>
                                          </Flex>,
                                          <Flex key={cat + 'players'} align="center" gap="2">
                                            <Text weight="bold" className="whitespace-nowrap">
                                              선수
                                            </Text>
                                            <Separator orientation="vertical" />
                                            <Text>{allPlayers.join(', ')}</Text>
                                          </Flex>,
                                        ];
                                      })()
                                    : categories[cat].map((award, idx) => (
                                        <Flex key={cat + idx} align="center" gap="2">
                                          <Text weight="bold" className="whitespace-nowrap">
                                            선수
                                          </Text>
                                          <Text>{award.players.join(', ')}</Text>
                                          <Separator orientation="vertical" mx="2" />
                                          <Text weight="bold">클럽</Text>
                                          <Text>{award.club}</Text>
                                        </Flex>
                                      ))}
                              </ul>
                            </Flex>
                          );
                        })}
                    </div>
                  </Box>
                );
              })}
            </div>
            {/* 대회별 구분선 (마지막 제외) */}
            {/* Object.entries(grouped).length > 1 && <Separator my="6" /> */}
          </div>
        );
      })}
    </Flex>
  );
}
