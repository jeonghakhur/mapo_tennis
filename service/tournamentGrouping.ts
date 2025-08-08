import { client } from '@/sanity/lib/client';
import type {
  Team,
  Group,
  Match,
  TournamentBracket,
  GroupStanding,
  GroupingOptions,
  GroupingResult,
  MatchResult,
  GroupResult,
  BracketOptions,
} from '@/types/tournament';

// 조편성 유틸리티 함수들
export class TournamentGroupingService {
  /**
   * 팀 목록을 조로 분배
   * @param teams 팀 목록
   * @param options 조편성 옵션
   * @returns 조편성 결과
   */
  static createGroups(teams: Team[], options: GroupingOptions): GroupingResult {
    const { method, teamsPerGroup, avoidSameClub } = options;

    // 팀 수에 따른 조 수 계산
    const totalTeams = teams.length;
    const totalGroups = Math.ceil(totalTeams / teamsPerGroup);

    // 조별 팀 수 분배 계산
    const baseTeamsPerGroup = Math.floor(totalTeams / totalGroups);
    const remainingTeams = totalTeams % totalGroups;

    const groupsWith3Teams = remainingTeams;
    const groupsWith2Teams = totalGroups - remainingTeams;

    // 팀 정렬 (시드 또는 랜덤)
    let sortedTeams = [...teams];
    if (method === 'seeded') {
      sortedTeams.sort((a, b) => (a.seed || 0) - (b.seed || 0));
    } else if (method === 'random') {
      sortedTeams = this.shuffleArray(sortedTeams);
    }

    // 같은 클럽 팀 분리
    if (avoidSameClub) {
      sortedTeams = this.separateSameClubTeams(sortedTeams);
    }

    // 조 생성
    const groups: Group[] = [];
    let teamIndex = 0;

    for (let i = 0; i < totalGroups; i++) {
      const groupId = this.generateGroupId(i);
      const groupName = this.generateGroupName(i);
      const division = teams[0]?.division || '';

      // 현재 조에 배정할 팀 수 결정
      const teamsInThisGroup = i < groupsWith3Teams ? 3 : 2;

      const groupTeams: Team[] = [];
      for (let j = 0; j < teamsInThisGroup && teamIndex < sortedTeams.length; j++) {
        groupTeams.push(sortedTeams[teamIndex]);
        teamIndex++;
      }

      groups.push({
        groupId,
        name: groupName,
        teams: groupTeams,
        division,
      });
    }

    return {
      groups,
      totalGroups,
      teamsPerGroup,
      remainingTeams,
      distribution: {
        groupsWith3Teams,
        groupsWith2Teams,
      },
    };
  }

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

      if (teams.length === 2) {
        // 2팀 조: 1경기
        matches.push({
          _id: `match_${tournamentId}_${group.division}_${matchNumber}`,
          tournamentId,
          division: group.division,
          groupId: group.groupId,
          matchNumber,
          team1: {
            teamId: teams[0]._id,
            teamName: teams[0].name,
          },
          team2: {
            teamId: teams[1]._id,
            teamName: teams[1].name,
          },
          status: 'scheduled',
          createdAt: new Date().toISOString(),
        });
        matchNumber++;
      } else if (teams.length === 3) {
        // 3팀 조: 3경기 (풀리그)
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
              },
              team2: {
                teamId: teams[j]._id,
                teamName: teams[j].name,
              },
              status: 'scheduled',
              createdAt: new Date().toISOString(),
            });
            matchNumber++;
          }
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
      if (
        match.status === 'completed' &&
        match.team1.score !== undefined &&
        match.team2.score !== undefined
      ) {
        const team1Standing = standings.get(match.team1.teamId);
        const team2Standing = standings.get(match.team2.teamId);

        if (team1Standing && team2Standing) {
          // 경기 수 증가
          team1Standing.played++;
          team2Standing.played++;

          // 득점/실점 기록
          team1Standing.goalsFor += match.team1.score;
          team1Standing.goalsAgainst += match.team2.score;
          team2Standing.goalsFor += match.team2.score;
          team2Standing.goalsAgainst += match.team1.score;

          // 승패 결정
          if (match.team1.score > match.team2.score) {
            team1Standing.won++;
            team2Standing.lost++;
            team1Standing.points += 3;
          } else if (match.team1.score < match.team2.score) {
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

      if (
        headToHeadMatch &&
        headToHeadMatch.team1.score !== undefined &&
        headToHeadMatch.team2.score !== undefined
      ) {
        if (headToHeadMatch.team1.teamId === a.teamId) {
          return headToHeadMatch.team1.score > headToHeadMatch.team2.score ? -1 : 1;
        } else {
          return headToHeadMatch.team2.score > headToHeadMatch.team1.score ? -1 : 1;
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
   * 본선 대진표 생성
   * @param advancingTeams 진출 팀 목록 (조별 1,2위)
   * @param options 대진표 생성 옵션
   * @param tournamentId 대회 ID
   * @param division 부서
   * @returns 본선 경기 목록
   */
  static createBracketMatches(
    advancingTeams: Team[],
    options: BracketOptions,
    tournamentId: string,
    division: string,
  ): Match[] {
    const { method, avoidSameGroup, seedByGroupPosition } = options;

    // 팀 정렬
    let sortedTeams = [...advancingTeams];
    if (method === 'seeded') {
      if (seedByGroupPosition) {
        // 조 순위로 시드 배정 (1위가 상위 시드)
        sortedTeams.sort((a, b) => {
          const aSeed = a.seed || 0;
          const bSeed = b.seed || 0;
          return aSeed - bSeed;
        });
      } else {
        // 기존 시드 순서 유지
        sortedTeams.sort((a, b) => (a.seed || 0) - (b.seed || 0));
      }
    } else {
      // 랜덤 배정
      sortedTeams = this.shuffleArray(sortedTeams);
    }

    // 같은 조 1,2위 분리
    if (avoidSameGroup) {
      sortedTeams = this.separateGroupWinners(sortedTeams);
    }

    // 토너먼트 브라켓 생성
    const totalTeams = sortedTeams.length;
    const rounds = this.calculateRounds(totalTeams);
    const matches: Match[] = [];
    let matchNumber = 1;

    // 각 라운드별 경기 생성
    for (let round = 1; round <= rounds; round++) {
      const teamsInRound = Math.pow(2, rounds - round + 1);
      const matchesInRound = teamsInRound / 2;

      for (let i = 0; i < matchesInRound; i++) {
        const team1Index = i * 2;
        const team2Index = team1Index + 1;

        const team1 = sortedTeams[team1Index];
        const team2 = sortedTeams[team2Index];

        if (team1 && team2) {
          matches.push({
            _id: `match_${tournamentId}_${division}_${matchNumber}`,
            tournamentId,
            division,
            round,
            matchNumber,
            team1: {
              teamId: team1._id,
              teamName: team1.name,
            },
            team2: {
              teamId: team2._id,
              teamName: team2.name,
            },
            status: 'scheduled',
            createdAt: new Date().toISOString(),
          });
        }
        matchNumber++;
      }
    }

    return matches;
  }

  /**
   * 라운드 수 계산 (16강=4라운드, 8강=3라운드 등)
   */
  private static calculateRounds(teamCount: number): number {
    return Math.ceil(Math.log2(teamCount));
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

  /**
   * 같은 조 1,2위 분리
   */
  private static separateGroupWinners(teams: Team[]): Team[] {
    // 조별로 팀 그룹화 (시드 번호로 조 구분)
    const groupTeams = new Map<string, Team[]>();

    teams.forEach((team) => {
      const groupKey = Math.floor((team.seed || 0) / 2).toString(); // 2팀씩 조
      if (!groupTeams.has(groupKey)) {
        groupTeams.set(groupKey, []);
      }
      groupTeams.get(groupKey)!.push(team);
    });

    // 1위와 2위 분리
    const winners: Team[] = [];
    const runnersUp: Team[] = [];

    groupTeams.forEach((groupTeam) => {
      if (groupTeam.length >= 1) {
        winners.push(groupTeam[0]); // 1위
      }
      if (groupTeam.length >= 2) {
        runnersUp.push(groupTeam[1]); // 2위
      }
    });

    // 1위와 2위를 번갈아가며 배정
    const separated: Team[] = [];
    const maxLength = Math.max(winners.length, runnersUp.length);

    for (let i = 0; i < maxLength; i++) {
      if (i < winners.length) {
        separated.push(winners[i]);
      }
      if (i < runnersUp.length) {
        separated.push(runnersUp[i]);
      }
    }

    return separated;
  }
}

// 서비스 함수들 (기존 API 패턴과 일치)
export async function createTournamentGroups(
  tournamentId: string,
  division: string,
  options: GroupingOptions,
): Promise<GroupingResult> {
  // 승인된 신청서에서 팀 목록 가져오기
  const query = `*[_type == "tournamentApplication" && tournamentId == $tournamentId && division == $division && status == "approved"] {
    _id,
    division,
    teamMembers,
    createdAt,
    createdBy
  } | order(createdAt asc)`;

  const applications = await client.fetch(query, { tournamentId, division });

  // 팀 객체로 변환
  const teams: Team[] = applications.map((app: any, index: number) => ({
    _id: app._id,
    name: `팀 ${index + 1}`,
    division: app.division,
    members: app.teamMembers,
    seed: index + 1, // 신청 순서로 시드 배정
    createdAt: app.createdAt,
  }));

  const result = TournamentGroupingService.createGroups(teams, options);

  // Sanity에 조 정보 저장
  const groupDocs = result.groups.map((group) => ({
    _type: 'tournamentGroup',
    tournamentId,
    division,
    groupId: group.groupId,
    name: group.name,
    teams: group.teams.map((team) => ({
      _id: team._id,
      name: team.name,
      seed: team.seed,
      members: team.members,
      createdAt: team.createdAt,
    })),
    createdAt: new Date().toISOString(),
    createdBy: 'system', // 시스템에서 생성
  }));

  // 기존 조 정보 삭제 후 새로 생성
  await client.delete({
    query: `*[_type == "tournamentGroup" && tournamentId == $tournamentId && division == $division]`,
    params: { tournamentId, division },
  });

  // 새 조 정보 생성
  await Promise.all(groupDocs.map((doc) => client.create(doc)));

  return result;
}

export async function createGroupMatches(tournamentId: string, division: string): Promise<Match[]> {
  // 조 정보 가져오기
  const groupsQuery = `*[_type == "tournamentGroup" && tournamentId == $tournamentId && division == $division] {
    _id,
    groupId,
    name,
    teams,
    division
  }`;

  const groups = await client.fetch(groupsQuery, { tournamentId, division });

  const matches = TournamentGroupingService.createGroupMatches(groups, tournamentId);

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
    groupId,
    team1,
    team2,
    status,
    winner
  }`;

  const [groups, matches] = await Promise.all([
    client.fetch(groupsQuery, { tournamentId, division }),
    client.fetch(matchesQuery, { tournamentId, division }),
  ]);

  if (!groups || groups.length === 0) {
    throw new Error('조 정보를 찾을 수 없습니다.');
  }

  // 모든 조의 순위를 합쳐서 반환
  const allStandings: GroupStanding[] = [];

  groups.forEach((group: Group) => {
    const groupStandings = TournamentGroupingService.calculateGroupStandings(group, matches);
    allStandings.push(...groupStandings);
  });

  return allStandings;
}
