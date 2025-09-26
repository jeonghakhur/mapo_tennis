import { client } from '@/sanity/lib/client';
import type { Team, Group, Match, GroupStanding } from '@/types/tournament';

// 조편성 유틸리티 함수들
export class TournamentGroupingService {
  /**
   * 예선 경기 생성
   * @param groups 조 목록
   * @param tournamentId 대회 ID
   * @returns 예선 경기 목록
   */
  static createGroupMatches(groups: Group[], tournamentId: string): Match[] {
    const matches: Match[] = [];
    let matchNumber = 1;

    groups.forEach((group) => {
      const { teams } = group;

      // 풀리그 방식: 모든 팀이 서로 한 번씩 경기
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          matches.push({
            _id: `match_${tournamentId}_${group.division}_${matchNumber}`,
            tournamentId,
            division: group.division,
            groupId: group.groupId,
            matchNumber,
            team1: {
              teamId: teams[i]._id,
              teamName: teams[i].name,
              players: teams[i].members.map((member) => member.name),
            },
            team2: {
              teamId: teams[j]._id,
              teamName: teams[j].name,
              players: teams[j].members.map((member) => member.name),
            },
            tournamentType: group.tournamentType, // 대회 타입에 따른 경기 타입
            status: 'scheduled',
            createdAt: new Date().toISOString(),
          });
          matchNumber++;
        }
      }
    });

    return matches;
  }

  /**
   * 조별 순위 계산
   * @param group 조 정보
   * @param matches 경기 결과 목록
   * @returns 조별 순위
   */
  static calculateGroupStandings(group: Group, matches: Match[]): GroupStanding[] {
    const groupMatches = matches.filter((match) => match.groupId === group.groupId);
    const standings = new Map<string, GroupStanding>();

    // 초기 순위 데이터 생성
    group.teams.forEach((team) => {
      standings.set(team._id, {
        teamId: team._id,
        teamName: team.name,
        groupId: group.groupId, // 조 이름 추가
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
        position: 0,
      });
    });

    // 경기 결과 반영
    groupMatches.forEach((match) => {
      if (match.status === 'completed') {
        const team1Standing = standings.get(match.team1.teamId);
        const team2Standing = standings.get(match.team2.teamId);

        if (team1Standing && team2Standing) {
          // 경기 수 증가
          team1Standing.played++;
          team2Standing.played++;

          // 세트별 점수로 승부 결정
          let team1SetsWon = 0;
          let team2SetsWon = 0;
          let team1TotalGames = 0;
          let team2TotalGames = 0;

          if (match.team1.sets && match.team2.sets) {
            const maxSets = Math.max(match.team1.sets.length, match.team2.sets.length);

            for (let i = 0; i < maxSets; i++) {
              const team1Games = match.team1.sets[i]?.games || 0;
              const team2Games = match.team2.sets[i]?.games || 0;
              const team1Tiebreak = match.team1.sets[i]?.tiebreak;
              const team2Tiebreak = match.team2.sets[i]?.tiebreak;

              // 총 게임 수 계산
              team1TotalGames += team1Games;
              team2TotalGames += team2Games;

              // 세트 승부 결정
              if (team1Games > team2Games) {
                team1SetsWon++;
              } else if (team2Games > team1Games) {
                team2SetsWon++;
              } else {
                // 게임 수가 동일한 경우 타이브레이크로 승부 결정
                if (team1Tiebreak !== undefined && team2Tiebreak !== undefined) {
                  if (team1Tiebreak > team2Tiebreak) {
                    team1SetsWon++;
                  } else if (team2Tiebreak > team1Tiebreak) {
                    team2SetsWon++;
                  }
                  // 타이브레이크도 동일하면 무승부 (둘 다 승리하지 않음)
                }
                // 타이브레이크 점수가 없으면 무승부 (둘 다 승리하지 않음)
              }
            }
          } else {
            // 기존 호환성을 위해 score 필드도 확인
            if (match.team1.score !== undefined && match.team2.score !== undefined) {
              team1TotalGames = match.team1.score;
              team2TotalGames = match.team2.score;

              if (match.team1.score > match.team2.score) {
                team1SetsWon = 1;
                team2SetsWon = 0;
              } else if (match.team2.score > match.team1.score) {
                team1SetsWon = 0;
                team2SetsWon = 1;
              }
            }
          }

          // 득점/실점 기록 (총 게임 수 사용)
          team1Standing.goalsFor += team1TotalGames;
          team1Standing.goalsAgainst += team2TotalGames;
          team2Standing.goalsFor += team2TotalGames;
          team2Standing.goalsAgainst += team1TotalGames;

          // 승패 결정 (세트 승부 기준)
          if (team1SetsWon > team2SetsWon) {
            team1Standing.won++;
            team2Standing.lost++;
            team1Standing.points += 3;
          } else if (team2SetsWon > team1SetsWon) {
            team1Standing.lost++;
            team2Standing.won++;
            team2Standing.points += 3;
          } else {
            team1Standing.drawn++;
            team2Standing.drawn++;
            team1Standing.points += 1;
            team2Standing.points += 1;
          }
        }
      }
    });

    // 득실차 계산
    standings.forEach((standing) => {
      standing.goalDifference = standing.goalsFor - standing.goalsAgainst;
    });

    // 순위 정렬 (승점 → 득실차 → 다득점 → 승자승)
    const sortedStandings = Array.from(standings.values()).sort((a, b) => {
      // 1. 승점
      if (a.points !== b.points) {
        return b.points - a.points;
      }

      // 2. 득실차
      if (a.goalDifference !== b.goalDifference) {
        return b.goalDifference - a.goalDifference;
      }

      // 3. 다득점
      if (a.goalsFor !== b.goalsFor) {
        return b.goalsFor - a.goalsFor;
      }

      // 4. 승자승 (직접 대결에서 이긴 팀이 우선)
      const headToHeadMatch = groupMatches.find(
        (match) =>
          match.status === 'completed' &&
          ((match.team1.teamId === a.teamId && match.team2.teamId === b.teamId) ||
            (match.team1.teamId === b.teamId && match.team2.teamId === a.teamId)),
      );

      if (headToHeadMatch) {
        // 세트별 점수로 승자승 판정
        let team1SetsWon = 0;
        let team2SetsWon = 0;

        if (headToHeadMatch.team1.sets && headToHeadMatch.team2.sets) {
          const maxSets = Math.max(
            headToHeadMatch.team1.sets.length,
            headToHeadMatch.team2.sets.length,
          );

          for (let i = 0; i < maxSets; i++) {
            const team1Games = headToHeadMatch.team1.sets[i]?.games || 0;
            const team2Games = headToHeadMatch.team2.sets[i]?.games || 0;
            const team1Tiebreak = headToHeadMatch.team1.sets[i]?.tiebreak;
            const team2Tiebreak = headToHeadMatch.team2.sets[i]?.tiebreak;

            if (team1Games > team2Games) {
              team1SetsWon++;
            } else if (team2Games > team1Games) {
              team2SetsWon++;
            } else {
              if (team1Tiebreak !== undefined && team2Tiebreak !== undefined) {
                if (team1Tiebreak > team2Tiebreak) {
                  team1SetsWon++;
                } else if (team2Tiebreak > team1Tiebreak) {
                  team2SetsWon++;
                }
              }
            }
          }
        } else {
          // 기존 호환성
          if (
            headToHeadMatch.team1.score !== undefined &&
            headToHeadMatch.team2.score !== undefined
          ) {
            if (headToHeadMatch.team1.score > headToHeadMatch.team2.score) {
              team1SetsWon = 1;
              team2SetsWon = 0;
            } else if (headToHeadMatch.team2.score > headToHeadMatch.team1.score) {
              team1SetsWon = 0;
              team2SetsWon = 1;
            }
          }
        }

        if (headToHeadMatch.team1.teamId === a.teamId) {
          return team1SetsWon > team2SetsWon ? -1 : 1;
        } else {
          return team2SetsWon > team1SetsWon ? -1 : 1;
        }
      }

      return 0;
    });

    // 순위 부여
    sortedStandings.forEach((standing, index) => {
      standing.position = index + 1;
    });

    return sortedStandings;
  }

  /**
   * 조 ID 생성
   */
  private static generateGroupId(index: number): string {
    return `group_${String.fromCharCode(65 + index)}`; // A, B, C, ...
  }

  /**
   * 조 이름 생성
   */
  private static generateGroupName(index: number): string {
    return `${String.fromCharCode(65 + index)}조`; // A조, B조, C조, ...
  }

  /**
   * 배열 셔플
   */
  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * 같은 클럽 팀 분리
   */
  private static separateSameClubTeams(teams: Team[]): Team[] {
    const separated: Team[] = [];
    const clubGroups = new Map<string, Team[]>();

    // 클럽별로 팀 그룹화
    teams.forEach((team) => {
      const clubId = team.members[0]?.clubId || 'unknown';
      if (!clubGroups.has(clubId)) {
        clubGroups.set(clubId, []);
      }
      clubGroups.get(clubId)!.push(team);
    });

    // 클럽별로 번갈아가며 배정
    const clubIds = Array.from(clubGroups.keys());
    const maxTeamsInClub = Math.max(
      ...Array.from(clubGroups.values()).map((teams) => teams.length),
    );

    for (let i = 0; i < maxTeamsInClub; i++) {
      for (const clubId of clubIds) {
        const clubTeams = clubGroups.get(clubId)!;
        if (i < clubTeams.length) {
          separated.push(clubTeams[i]);
        }
      }
    }

    return separated;
  }
}

// 타입 정의
interface SanityGroup {
  _id: string;
  groupId: string;
  name: string;
  teams: Array<{
    _key: string;
    name: string;
    seed?: number;
    members: Array<{
      _key: string;
      name: string;
      clubId: string;
      clubName: string;
      birth?: string;
      score?: number;
      isRegisteredMember: boolean;
    }>;
    createdAt: string;
  }>;
  division: string;
  tournamentType: 'individual' | 'team';
}

export async function createGroupMatches(tournamentId: string, division: string): Promise<Match[]> {
  // 조 정보 가져오기 (tournamentType 포함)
  const groupsQuery = `*[_type == "tournamentGroup" && tournamentId == $tournamentId && division == $division] {
    _id,
    groupId,
    teams,
    division,
    tournamentType
  }`;

  const groups = (await client.fetch(groupsQuery, { tournamentId, division })) as SanityGroup[];

  // Sanity에서 가져온 teams 배열의 _key를 _id로 변환
  const processedGroups = groups.map((group) => ({
    ...group,
    groupId: group.groupId, // _id를 groupId로 매핑
    teams: group.teams.map((team) => ({
      ...team,
      _id: team._key, // _key를 _id로 변환
    })),
  }));

  const matches = TournamentGroupingService.createGroupMatches(processedGroups, tournamentId);
  console.log('matches', matches);

  // 기존 경기 정보 삭제
  await client.delete({
    query: `*[_type == "tournamentMatch" && tournamentId == $tournamentId && division == $division]`,
    params: { tournamentId, division },
  });

  // 새 경기 정보 생성
  const matchDocs = matches.map((match) => ({
    _type: 'tournamentMatch',
    tournamentId,
    division,
    groupId: match.groupId,
    tournamentType: match.tournamentType, // 경기 타입 추가
    round: match.round,
    matchNumber: match.matchNumber,
    team1: match.team1,
    team2: match.team2,
    winner: match.winner,
    status: match.status,
    scheduledTime: match.scheduledTime,
    court: match.court,
    createdAt: match.createdAt,
    updatedAt: match.updatedAt,
  }));

  await Promise.all(matchDocs.map((doc) => client.create(doc)));

  return matches;
}

export async function calculateGroupStandings(
  tournamentId: string,
  division: string,
): Promise<GroupStanding[]> {
  // 모든 조 정보와 경기 결과 가져오기
  const groupsQuery = `*[_type == "tournamentGroup" && tournamentId == $tournamentId && division == $division] {
    _id,
    groupId,
    name,
    teams,
    division
  }`;

  const matchesQuery = `*[_type == "tournamentMatch" && tournamentId == $tournamentId && division == $division] {
    _id,
    groupName,
    matchType,
    team1,
    team2,
    status,
    winner
  }`;

  const [groups, matches] = await Promise.all([
    client.fetch(groupsQuery, { tournamentId, division }) as unknown as SanityGroup[],
    client.fetch(matchesQuery, { tournamentId, division }),
  ]);

  if (!groups || groups.length === 0) {
    throw new Error('조 정보를 찾을 수 없습니다.');
  }

  // Sanity에서 가져온 teams 배열의 _key를 _id로 변환
  const processedGroups = groups.map((group) => ({
    ...group,
    groupId: group.groupId, // _id를 groupId로 매핑
    teams: group.teams.map((team) => ({
      ...team,
      _id: team._key, // _key를 _id로 변환
      division: group.division, // division 필드 추가
    })),
  }));

  // 모든 조의 순위를 합쳐서 반환
  const allStandings: GroupStanding[] = [];

  processedGroups.forEach((group: Group) => {
    const groupStandings = TournamentGroupingService.calculateGroupStandings(group, matches);
    allStandings.push(...groupStandings);
  });

  return allStandings;
}
