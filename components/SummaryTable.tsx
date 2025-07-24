// components/SummaryTable.tsx
import React from 'react';
import { Award } from '@/model/award';
import { Text, Flex, Separator, Box } from '@radix-ui/themes';
import { Trophy, Medal, Star } from 'lucide-react';

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

  return (
    <Flex direction="column" gap="4" style={{ width: '100%' }}>
      {Object.entries(grouped).map(([compYear, divisions]) => {
        const [competition, year] = compYear.split('||');
        // 대표 gameType 추출
        const firstDivision = Object.values(divisions)[0];
        const firstAward = firstDivision && firstDivision[0];
        const gameType = firstAward?.gameType;
        return (
          <React.Fragment key={compYear}>
            <Text size="4" weight="bold" as="div" mb="2">
              {year} {competition}
              {gameType && (
                <Text as="span" size="3" color="gray" ml="2">
                  ({gameType})
                </Text>
              )}
            </Text>
            {/* 이하 division 렌더링 동일 */}
            <div className="space-y-4">
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
                    mb={divIdx < arr.length - 1 ? '4' : '0'}
                    p="4"
                    style={{
                      background: '#f9fafb',
                      borderRadius: 12,
                      border: '1px solid #e5e7eb',
                    }}
                  >
                    <Text size="3" weight="bold" as="div" mb="2">
                      {division}
                    </Text>
                    <div className="space-y-2">
                      {categoryOrder
                        .filter((cat) => categories[cat])
                        .map((cat) => (
                          <Flex key={cat} className="mb-4" align="center" gap="2">
                            {cat === '우승' ? (
                              <Trophy size={20} style={{ color: '#FFD700' }} />
                            ) : cat === '준우승' ? (
                              <Medal size={20} style={{ color: '#C0C0C0' }} />
                            ) : (
                              <Star size={20} style={{ color: '#CD7F32' }} />
                            )}
                            <Text size="2" weight="bold">
                              {cat}
                            </Text>

                            <ul className="ml-2 mt-1 space-y-1">
                              {categories[cat][0]?.gameType === '단체전'
                                ? (() => {
                                    const clubs = Array.from(
                                      new Set(categories[cat].map((a) => a.club)),
                                    );
                                    const allPlayers = Array.from(
                                      new Set(categories[cat].flatMap((a) => a.players)),
                                    );
                                    return [
                                      <Flex key={cat + 'clubs'} align="center" gap="2">
                                        <Text size="2" weight="bold">
                                          클럽
                                        </Text>
                                        <Text size="2">{clubs.join(', ')}</Text>
                                      </Flex>,
                                      <Flex key={cat + 'players'} align="center" gap="2">
                                        <Text size="2" weight="bold">
                                          선수
                                        </Text>
                                        <Text size="2">{allPlayers.join(', ')}</Text>
                                      </Flex>,
                                    ];
                                  })()
                                : categories[cat].map((award, idx) => (
                                    <Flex key={cat + idx} align="center" gap="2">
                                      <Text size="2" weight="bold">
                                        선수
                                      </Text>
                                      <Text size="2">{award.players.join(', ')}</Text>
                                      <Separator orientation="vertical" mx="2" />
                                      <Text size="2" weight="bold">
                                        클럽
                                      </Text>
                                      <Text size="2">{award.club}</Text>
                                    </Flex>
                                  ))}
                            </ul>
                          </Flex>
                        ))}
                    </div>
                  </Box>
                );
              })}
            </div>
            {/* 대회별 구분선 (마지막 제외) */}
            {/* Object.entries(grouped).length > 1 && <Separator my="6" /> */}
          </React.Fragment>
        );
      })}
    </Flex>
  );
}
