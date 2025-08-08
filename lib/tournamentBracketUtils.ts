import { client } from '@/sanity/lib/client';

export interface BracketMatch {
  _key: string;
  round: 'round32' | 'round16' | 'quarterfinal' | 'semifinal' | 'final';
  matchNumber: number;
  team1: {
    teamId: string;
    teamName: string;
    score?: number;
  };
  team2: {
    teamId: string;
    teamName: string;
    score?: number;
  };
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  court?: string;
  winner?: string;
}

export interface TournamentBracket {
  _id: string;
  _type: 'tournamentBracket';
  tournamentId: string;
  division: string;
  matches: BracketMatch[];
  createdAt: string;
  updatedAt: string;
}

// 본선 대진표 조회
export async function getTournamentBracket(
  tournamentId: string,
  division: string,
): Promise<TournamentBracket | null> {
  try {
    const bracket = await client.fetch(
      `
      *[_type == "tournamentBracket" && tournamentId == $tournamentId && division == $division][0] {
        _id,
        _type,
        tournamentId,
        division,
        matches,
        createdAt,
        updatedAt
      }
    `,
      { tournamentId, division },
    );

    return bracket;
  } catch (error) {
    console.error('본선 대진표 조회 오류:', error);
    return null;
  }
}

// 본선 대진표 생성
export async function createTournamentBracket(
  tournamentId: string,
  division: string,
  matches: BracketMatch[],
): Promise<TournamentBracket | null> {
  try {
    // 기존 대진표 삭제
    await deleteTournamentBracket(tournamentId, division);

    // 새 대진표 생성
    const bracket = await client.create({
      _type: 'tournamentBracket',
      tournamentId,
      division,
      matches,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return bracket;
  } catch (error) {
    console.error('본선 대진표 생성 오류:', error);
    return null;
  }
}

// 본선 대진표 삭제
export async function deleteTournamentBracket(
  tournamentId: string,
  division: string,
): Promise<boolean> {
  try {
    const bracket = await getTournamentBracket(tournamentId, division);
    if (bracket) {
      await client.delete(bracket._id);
    }
    return true;
  } catch (error) {
    console.error('본선 대진표 삭제 오류:', error);
    return false;
  }
}

// 경기 결과 업데이트
export async function updateBracketMatch(
  bracketId: string,
  matchKey: string,
  matchData: Partial<BracketMatch>,
): Promise<boolean> {
  try {
    const bracket = await client.getDocument(bracketId);
    if (!bracket) return false;

    const updatedMatches = bracket.matches.map((match: BracketMatch) => {
      if (match._key === matchKey) {
        return { ...match, ...matchData };
      }
      return match;
    });

    await client
      .patch(bracketId)
      .set({
        matches: updatedMatches,
        updatedAt: new Date().toISOString(),
      })
      .commit();

    return true;
  } catch (error) {
    console.error('경기 결과 업데이트 오류:', error);
    return false;
  }
}

// 조별 순위 조회 (진출팀 선정용)
export async function getGroupStandings(tournamentId: string, division: string): Promise<any[]> {
  try {
    const standings = await client.fetch(
      `
      *[_type == "tournamentGroup" && tournamentId == $tournamentId && division == $division] {
        _id,
        groupId,
        teams[] {
          teamId,
          name,
          position,
          points,
          goalDifference
        }
      }
    `,
      { tournamentId, division },
    );

    return standings;
  } catch (error) {
    console.error('조별 순위 조회 오류:', error);
    return [];
  }
}

// 진출팀 선정
export function selectQualifiedTeams(standings: any[]): any[] {
  const qualifiedTeams: any[] = [];
  const standingsByGroup = new Map<string, any[]>();

  standings.forEach((group) => {
    const groupId = group.groupId;
    if (!standingsByGroup.has(groupId)) {
      standingsByGroup.set(groupId, []);
    }

    // 각 팀의 순위 정보를 추가
    group.teams.forEach((team: any) => {
      standingsByGroup.get(groupId)!.push({
        ...team,
        teamName: team.name, // name을 teamName으로 매핑
        groupId,
      });
    });
  });

  // 각 조별로 1,2위 팀 선정
  standingsByGroup.forEach((groupTeams) => {
    const sortedTeams = groupTeams.sort((a, b) => a.position - b.position);
    qualifiedTeams.push(sortedTeams[0]); // 1위
    if (sortedTeams[1]) {
      qualifiedTeams.push(sortedTeams[1]); // 2위
    }
  });

  return qualifiedTeams;
}

// 본선 대진표 자동 생성
export function generateBracketMatches(qualifiedTeams: any[]): BracketMatch[] {
  const matches: BracketMatch[] = [];
  let matchNumber = 1;

  // 참가팀 수에 따른 라운드 자동 결정
  const teamCount = qualifiedTeams.length;

  // 32강 (17-32팀)
  if (teamCount >= 17) {
    const round32Matches = Math.ceil(teamCount / 2);
    for (let i = 0; i < round32Matches; i++) {
      const team1 = qualifiedTeams[i];
      const team2 = qualifiedTeams[qualifiedTeams.length - 1 - i] || {
        teamId: '',
        teamName: 'TBD',
      };

      matches.push({
        _key: `round32_${Date.now()}_${matchNumber}`,
        round: 'round32',
        matchNumber: matchNumber++,
        team1: {
          teamId: team1.teamId,
          teamName: team1.teamName || team1.name,
        },
        team2: {
          teamId: team2.teamId,
          teamName: team2.teamName || team2.name,
        },
        status: 'scheduled',
      });
    }
  }
  // 16강 (9-16팀)
  else if (teamCount >= 9) {
    const round16Matches = Math.ceil(teamCount / 2);
    for (let i = 0; i < round16Matches; i++) {
      const team1 = qualifiedTeams[i];
      const team2 = qualifiedTeams[qualifiedTeams.length - 1 - i] || {
        teamId: '',
        teamName: 'TBD',
      };

      matches.push({
        _key: `round16_${Date.now()}_${matchNumber}`,
        round: 'round16',
        matchNumber: matchNumber++,
        team1: {
          teamId: team1.teamId,
          teamName: team1.teamName || team1.name,
        },
        team2: {
          teamId: team2.teamId,
          teamName: team2.teamName || team2.name,
        },
        status: 'scheduled',
      });
    }
  }
  // 8강 (5-8팀)
  else if (teamCount >= 5) {
    const quarterfinalMatches = Math.ceil(teamCount / 2);
    for (let i = 0; i < quarterfinalMatches; i++) {
      const team1 = qualifiedTeams[i];
      const team2 = qualifiedTeams[qualifiedTeams.length - 1 - i] || {
        teamId: '',
        teamName: 'TBD',
      };

      matches.push({
        _key: `quarterfinal_${Date.now()}_${matchNumber}`,
        round: 'quarterfinal',
        matchNumber: matchNumber++,
        team1: {
          teamId: team1.teamId,
          teamName: team1.teamName || team1.name,
        },
        team2: {
          teamId: team2.teamId,
          teamName: team2.teamName || team2.name,
        },
        status: 'scheduled',
      });
    }
  }
  // 4강 (3-4팀)
  else if (teamCount >= 3) {
    const semifinalMatches = Math.ceil(teamCount / 2);
    for (let i = 0; i < semifinalMatches; i++) {
      const team1 = qualifiedTeams[i];
      const team2 = qualifiedTeams[qualifiedTeams.length - 1 - i] || {
        teamId: '',
        teamName: 'TBD',
      };

      matches.push({
        _key: `semifinal_${Date.now()}_${matchNumber}`,
        round: 'semifinal',
        matchNumber: matchNumber++,
        team1: {
          teamId: team1.teamId,
          teamName: team1.teamName || team1.name,
        },
        team2: {
          teamId: team2.teamId,
          teamName: team2.teamName || team2.name,
        },
        status: 'scheduled',
      });
    }
  }
  // 결승 (2팀)
  else if (teamCount === 2) {
    const team1 = qualifiedTeams[0];
    const team2 = qualifiedTeams[1];

    matches.push({
      _key: `final_${Date.now()}_${matchNumber}`,
      round: 'final',
      matchNumber: matchNumber++,
      team1: {
        teamId: team1.teamId,
        teamName: team1.teamName || team1.name,
      },
      team2: {
        teamId: team2.teamId,
        teamName: team2.teamName || team2.name,
      },
      status: 'scheduled',
    });
  }

  return matches;
}
