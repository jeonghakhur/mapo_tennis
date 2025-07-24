// components/SummaryTable.tsx
import React from 'react';
import { Award } from '@/model/award';
import { Card, Text, Flex, Separator, Badge } from '@radix-ui/themes';
import { Users, Shield } from 'lucide-react';

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
        return (
          <Card
            key={compYear}
            className="p-6"
            style={{
              // flex: '1 1 350px',
              minWidth: 0,
              maxWidth: '100%',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            <Text size="4" weight="bold" as="div" mb="2">
              {competition}
            </Text>
            <Text size="3" color="gray" as="div" mb="4">
              {year}
            </Text>
            <div className="space-y-4">
              {Object.entries(divisions).map(([division, awardsInDivision]) => {
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
                  <div key={division}>
                    <Text size="3" weight="bold" as="div" mb="1">
                      {division}
                    </Text>
                    <div className="space-y-2">
                      {categoryOrder
                        .filter((cat) => categories[cat])
                        .map((cat) => (
                          <div key={cat} className="mb-4">
                            <Flex align="center" gap="2" mb="1">
                              <Badge
                                color={
                                  cat === '우승' ? 'gold' : cat === '준우승' ? 'gray' : 'bronze'
                                }
                                variant="solid"
                              >
                                {cat}
                              </Badge>
                              <Separator orientation="vertical" mx="2" />
                              <Text size="2" color="gray">
                                {categories[cat][0]?.gameType}
                              </Text>
                            </Flex>
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
                                        <Shield size={16} style={{ color: '#888' }} />
                                        <Text size="2" weight="bold">
                                          클럽
                                        </Text>
                                        <Text size="2">{clubs.join(', ')}</Text>
                                      </Flex>,
                                      <Flex key={cat + 'players'} align="center" gap="2">
                                        <Users size={16} style={{ color: '#888' }} />
                                        <Text size="2" weight="bold">
                                          선수
                                        </Text>
                                        <Text size="2">{allPlayers.join(', ')}</Text>
                                      </Flex>,
                                    ];
                                  })()
                                : categories[cat].map((award, idx) => (
                                    <Flex key={cat + idx} align="center" gap="2">
                                      <Users size={16} style={{ color: '#888' }} />
                                      <Text size="2" weight="bold">
                                        선수
                                      </Text>
                                      <Text size="2">{award.players.join(', ')}</Text>
                                      <Separator orientation="vertical" mx="2" />
                                      <Shield size={16} style={{ color: '#888' }} />
                                      <Text size="2" weight="bold">
                                        클럽
                                      </Text>
                                      <Text size="2">{award.club}</Text>
                                    </Flex>
                                  ))}
                            </ul>
                          </div>
                        ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}
    </Flex>
  );
}
