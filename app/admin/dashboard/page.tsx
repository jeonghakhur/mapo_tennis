'use client';
import Container from '@/components/Container';
import '@radix-ui/themes/styles.css';
import { Text, Card, Table, Box } from '@radix-ui/themes';
import { useTournamentsByUserLevel } from '@/hooks/useTournaments';
import { useTournamentApplications } from '@/hooks/useTournamentApplications';
import type { Tournament } from '@/model/tournament';
import type { TournamentApplication } from '@/model/tournamentApplication';

export default function AdminDashboardPage() {
  const { tournaments, isLoading: tournamentsLoading } = useTournamentsByUserLevel(5); // 관리자 레벨
  const { applications, isLoading: applicationsLoading } = useTournamentApplications();
  const loading = tournamentsLoading || applicationsLoading;

  // 대회별, 부서별 참가팀 수 집계
  const getDivisionApplicationCount = (tournamentId: string, division: string) =>
    applications.filter((app) => app.tournamentId === tournamentId && app.division === division)
      .length;

  // 부서 한글 매핑
  const divisionLabelMap: Record<string, string> = {
    master: '마스터부',
    challenger: '챌린저부',
    futures: '퓨처스부',
    forsythia: '개나리부',
    chrysanthemum: '국화부',
  };

  return (
    <Container>
      <Text size="5" weight="bold" mb="4">
        대회별 참가자 신청 대시보드
      </Text>
      {loading ? (
        <Text>로딩 중...</Text>
      ) : tournaments.length === 0 ? (
        <Text>등록된 대회가 없습니다.</Text>
      ) : (
        <Box className="space-y-8">
          {tournaments.map((tournament) => (
            <Card key={tournament._id} className="p-6">
              <Text size="4" weight="bold" mb="2">
                {tournament.title}
              </Text>
              <Text size="2" color="gray" mb="4">
                {new Date(tournament.startDate).toLocaleDateString()} ~{' '}
                {new Date(tournament.endDate).toLocaleDateString()} | {tournament.location}
              </Text>
              {tournament.divisions && tournament.divisions.length > 0 ? (
                <Table.Root>
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeaderCell>부서</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>참가팀 (신청/최대)</Table.ColumnHeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {tournament.divisions
                      .filter((div) => div.teamCount > 0)
                      .map((div) => {
                        const applied = getDivisionApplicationCount(tournament._id, div.division);
                        return (
                          <Table.Row key={div.division}>
                            <Table.Cell>
                              {divisionLabelMap[div.division] || div.division}
                            </Table.Cell>
                            <Table.Cell>
                              {applied} / {div.teamCount}
                            </Table.Cell>
                          </Table.Row>
                        );
                      })}
                  </Table.Body>
                </Table.Root>
              ) : (
                <Text size="2" color="gray">
                  부서 정보 없음
                </Text>
              )}
            </Card>
          ))}
        </Box>
      )}
    </Container>
  );
}
