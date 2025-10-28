import { client } from '@/sanity/lib/client';

export interface SetScore {
  _key: string;
  setNumber: number;
  games: number;
  tiebreak?: number;
  players: string[];
}

export interface BracketMatch {
  _key: string;
  round: 'round32' | 'round16' | 'quarterfinal' | 'semifinal' | 'final';
  matchNumber: number;
  team1: {
    teamId: string;
    teamName: string;
    score?: number;
    sets?: SetScore[];
    totalSetsWon?: number;
  };
  team2: {
    teamId: string;
    teamName: string;
    score?: number;
    sets?: SetScore[];
    totalSetsWon?: number;
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

    return bracket as TournamentBracket;
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

    return bracket as TournamentBracket;
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
  matchData: Partial<BracketMatch> & {
    team1Name?: string;
    team2Name?: string;
  },
): Promise<boolean> {
  try {
    console.log('updateBracketMatch 시작:', { bracketId, matchKey, matchData });

    const bracket = await client.getDocument(bracketId);
    if (!bracket) {
      console.error('대진표를 찾을 수 없음:', bracketId);
      return false;
    }

    const updatedMatches = bracket.matches.map((match: BracketMatch) => {
      if (match._key === matchKey) {
        // 팀명 업데이트 처리
        const updatedMatch = { ...match, ...matchData };

        // team1Name이 있으면 team1.teamName 업데이트
        if (matchData.team1Name !== undefined) {
          updatedMatch.team1 = {
            ...updatedMatch.team1,
            teamName: matchData.team1Name,
          };
        }

        // team2Name이 있으면 team2.teamName 업데이트
        if (matchData.team2Name !== undefined) {
          updatedMatch.team2 = {
            ...updatedMatch.team2,
            teamName: matchData.team2Name,
          };
        }

        // team1Name, team2Name은 제거 (BracketMatch 타입에 없음)
        const { ...finalMatch } = updatedMatch;

        return finalMatch;
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
export async function getGroupStandings(
  tournamentId: string,
  division: string,
): Promise<
  Array<{
    _id: string;
    groupId: string;
    teams: Array<{
      teamId: string;
      name: string;
      position: number;
      points: number;
      goalDifference: number;
    }>;
  }>
> {
  try {
    // calculateGroupStandings 함수를 사용하여 실제 순위 계산
    const { calculateGroupStandings } = await import('@/service/tournamentGrouping');
    const groupStandings = await calculateGroupStandings(tournamentId, division);

    // 조별로 그룹화
    const standingsByGroup = new Map<
      string,
      Array<{
        teamId: string;
        name: string;
        position: number;
        points: number;
        goalDifference: number;
      }>
    >();

    groupStandings.forEach((standing) => {
      const groupId = standing.groupId || 'unknown';
      if (!standingsByGroup.has(groupId)) {
        standingsByGroup.set(groupId, []);
      }
      standingsByGroup.get(groupId)!.push({
        teamId: standing.teamId,
        name: standing.teamName,
        position: standing.position,
        points: standing.points,
        goalDifference: standing.goalDifference,
      });
    });

    // API 응답 형식에 맞게 변환
    const result = Array.from(standingsByGroup.entries()).map(([groupId, teams]) => ({
      _id: `group_${groupId}`,
      groupId,
      teams,
    }));

    return result;
  } catch (error) {
    console.error('조별 순위 조회 오류:', error);
    throw new Error(
      `조별 순위 조회 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
    );
  }
}

// 진출팀 선정
export function selectQualifiedTeams(
  standings: Array<{
    _id: string;
    groupId: string;
    teams: Array<{
      teamId: string;
      name: string;
      position: number;
      points: number;
      goalDifference: number;
    }>;
  }>,
): Array<{
  teamId: string;
  teamName: string;
  name: string;
  groupId: string;
  position: number;
  points: number;
  goalDifference: number;
}> {
  const qualifiedTeams: Array<{
    teamId: string;
    teamName: string;
    name: string;
    groupId: string;
    position: number;
    points: number;
    goalDifference: number;
  }> = [];
  const standingsByGroup = new Map<
    string,
    Array<{
      teamId: string;
      name: string;
      teamName: string;
      groupId: string;
      position: number;
      points: number;
      goalDifference: number;
    }>
  >();

  standings.forEach((group) => {
    const groupId = group.groupId;
    if (!standingsByGroup.has(groupId)) {
      standingsByGroup.set(groupId, []);
    }

    // 각 팀의 순위 정보를 추가
    group.teams.forEach(
      (team: {
        teamId: string;
        name: string;
        position: number;
        points: number;
        goalDifference: number;
      }) => {
        standingsByGroup.get(groupId)!.push({
          ...team,
          teamName: team.name, // name을 teamName으로 매핑
          groupId,
        });
      },
    );
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

import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 12);

type SeedSlot = {
  teamId: string;
  teamName: string;
  isBye?: boolean;
};

function roundFromSize(size: number): BracketMatch['round'] {
  if (size === 32) return 'round32';
  if (size === 16) return 'round16';
  if (size === 8) return 'quarterfinal';
  if (size === 4) return 'semifinal';
  return 'final';
}

/** 현재 라운드의 모든 경기가 완료되었는지 확인 */
export function isRoundCompleted(matches: BracketMatch[], round: BracketMatch['round']): boolean {
  const roundMatches = matches.filter((m) => m.round === round);
  if (roundMatches.length === 0) return false;

  return roundMatches.every(
    (match) =>
      match.status === 'completed' &&
      match.winner !== undefined &&
      // Bye팀이 아닌 실제 팀이 승리한 경우만 완료로 간주
      (match.winner === match.team1.teamId
        ? match.team1.teamName !== 'BYE'
        : match.team2.teamName !== 'BYE'),
  );
}

/** 현재 라운드에서 승리한 팀들을 반환 */
export function getWinningTeams(
  matches: BracketMatch[],
  round: BracketMatch['round'],
): Array<{
  teamId: string;
  teamName: string;
  groupId: string;
  position: number;
  points: number;
  goalDifference: number;
}> {
  const roundMatches = matches.filter((m) => m.round === round);
  const winningTeams: Array<{
    teamId: string;
    teamName: string;
    groupId: string;
    position: number;
    points: number;
    goalDifference: number;
  }> = [];

  roundMatches.forEach((match) => {
    if (match.status === 'completed' && match.winner) {
      // winner는 teamId 값이므로 team1 또는 team2와 비교
      const winningTeam = match.winner === match.team1.teamId ? match.team1 : match.team2;

      console.log(`경기 ${match.matchNumber} 승리팀 확인:`, {
        winner: match.winner,
        team1: { teamId: match.team1.teamId, teamName: match.team1.teamName },
        team2: { teamId: match.team2.teamId, teamName: match.team2.teamName },
        winningTeam: { teamId: winningTeam.teamId, teamName: winningTeam.teamName },
      });

      // Bye팀이 아닌 실제 팀만 다음 라운드로 진출
      if (winningTeam.teamName !== 'BYE' && winningTeam.teamName !== 'bye' && winningTeam.teamId) {
        console.log(`진출팀 추가: ${winningTeam.teamName} (${winningTeam.teamId})`);
        winningTeams.push({
          teamId: winningTeam.teamId,
          teamName: winningTeam.teamName,
          groupId: 'bracket_winner', // 본선 승리자
          position: 1,
          points: 6,
          goalDifference: 6,
        });
      } else {
        console.log(`Bye팀 필터링됨: ${winningTeam.teamName} (${winningTeam.teamId})`);
      }
    }
  });

  return winningTeams;
}

/** 다음 라운드 이름을 반환 */
export function getNextRound(currentRound: BracketMatch['round']): BracketMatch['round'] | null {
  const roundOrder: BracketMatch['round'][] = [
    'round32',
    'round16',
    'quarterfinal',
    'semifinal',
    'final',
  ];
  const currentIndex = roundOrder.indexOf(currentRound);

  if (currentIndex === -1 || currentIndex === roundOrder.length - 1) {
    return null; // 마지막 라운드이거나 잘못된 라운드
  }

  return roundOrder[currentIndex + 1];
}

function generateSeedOrder(size: number): number[] {
  // 16강 시드 순서 (표준 토너먼트 시드)
  if (size === 16) {
    return [1, 16, 9, 8, 5, 12, 13, 4, 3, 14, 11, 6, 7, 10, 15, 2];
  }

  // 8강 시드 순서
  if (size === 8) {
    return [1, 8, 5, 4, 3, 6, 7, 2];
  }

  // 4강 시드 순서
  if (size === 4) {
    return [1, 4, 3, 2];
  }

  // 2강 (결승)
  if (size === 2) {
    return [1, 2];
  }

  // 32강 시드 순서 (필요시 추가)
  if (size === 32) {
    return [
      1, 32, 17, 16, 9, 24, 25, 8, 5, 28, 21, 12, 13, 20, 29, 4, 3, 30, 19, 14, 11, 22, 27, 6, 7,
      26, 23, 10, 15, 18, 31, 2,
    ];
  }

  // 기본 로직 (다른 크기용)
  let order = [1, 2];
  while (order.length < size) {
    const next: number[] = [];
    const m = order.length * 2;
    for (const s of order) next.push(s);
    for (let i = order.length - 1; i >= 0; i--) {
      next.push(m + 1 - order[i]);
    }
    order = next;
  }
  return order;
}

export function generateBracketMatches(
  qualifiedTeams: Array<{
    teamId: string;
    teamName?: string;
    name?: string;
    groupId: string;
    position: number; // 낮을수록 상위
    points: number;
    goalDifference: number;
  }>,
): BracketMatch[] {
  console.log('generateBracketMatches 시작:', {
    teamCount: qualifiedTeams.length,
    teams: qualifiedTeams,
  });

  const teams = [...qualifiedTeams]
    .map((t) => ({
      teamId: t.teamId,
      teamName: t.teamName || t.name || 'Unnamed',
      position: t.position,
      points: t.points,
      goalDifference: t.goalDifference,
    }))
    .sort((a, b) => {
      // 1순위: 승점 (높은 순)
      if (a.points !== b.points) {
        return b.points - a.points;
      }
      // 2순위: 득실차 (높은 순)
      if (a.goalDifference !== b.goalDifference) {
        return b.goalDifference - a.goalDifference;
      }
      // 3순위: 기존 순위 (낮은 순)
      return a.position - b.position;
    });

  const teamCount = teams.length;
  if (teamCount < 2) return [];

  console.log(
    '정렬된 팀 목록:',
    teams.map(
      (t, index) =>
        `${index + 1}. ${t.teamName} (승점: ${t.points}, 득실차: ${t.goalDifference}, 조순위: ${t.position})`,
    ),
  );

  // ✅ 팀 수 기준으로 "시작 라운드" 고정 (요청하신 규칙)
  let bracketSize = 2;
  if (teamCount >= 17) bracketSize = 32;
  else if (teamCount >= 9) bracketSize = 16;
  else if (teamCount >= 5) bracketSize = 8;
  else if (teamCount >= 3) bracketSize = 4;
  else bracketSize = 2;

  const round = roundFromSize(bracketSize);
  console.log('브래킷 설정:', { teamCount, bracketSize, round });

  // ✅ 표준 시드 순서에 따라 슬롯 채우기 + BYE 채우기
  const seedOrder = generateSeedOrder(bracketSize); // 길이 = bracketSize, 값 = 1..bracketSize
  console.log('시드 순서:', seedOrder);

  // 바이를 적절히 분산해서 배정
  const byes = bracketSize - teamCount;

  // 슬롯 초기화
  const slots: SeedSlot[] = Array.from({ length: bracketSize }, () => ({
    teamId: '',
    teamName: 'BYE',
    isBye: true,
  }));

  // 실제 팀들을 시드 순서대로 배치
  console.log('팀 배치 시작:', { teamCount, bracketSize, byes });
  for (let i = 0; i < teamCount; i++) {
    const seedPos = seedOrder[i] - 1; // 0-based
    const t = teams[i];
    console.log(`팀 ${i + 1} 배치: ${t.teamName} -> 슬롯 ${seedPos} (시드 ${seedOrder[i]})`);
    slots[seedPos] = { teamId: t.teamId, teamName: t.teamName, isBye: false };
  }

  console.log(
    '슬롯 배치:',
    slots.map((slot, index) => `${index}: ${slot.teamName}${slot.isBye ? ' (BYE)' : ''}`),
  );

  // ✅ 매치 생성: 인접 슬롯끼리 (0,1), (2,3) ...
  const matches: BracketMatch[] = [];
  let matchNumber = 1;

  for (let i = 0; i < bracketSize; i += 2) {
    const a = slots[i];
    const b = slots[i + 1];

    const key = `${round}_${nanoid()}`;
    console.log(`매치 ${matchNumber} 생성:`, {
      slot1: `${i}: ${a.teamName}${a.isBye ? ' (BYE)' : ''}`,
      slot2: `${i + 1}: ${b.teamName}${b.isBye ? ' (BYE)' : ''}`,
    });

    // 둘 다 BYE면 스킵 (실경기도 없고 승자도 없음)
    if (a.isBye && b.isBye) {
      console.log(`  -> 둘 다 BYE, 스킵`);
      continue;
    }

    // 한쪽만 BYE면 상대 자동 승리로 완료 처리(원하지 않으면 scheduled로 두고 winner 생략 가능)
    if (a.isBye || b.isBye) {
      const winner = a.isBye ? b : a;
      console.log(`  -> 바이 경기, 승자: ${winner.teamName}`);
      matches.push({
        _key: key,
        round,
        matchNumber: matchNumber++,
        team1: {
          teamId: a.teamId,
          teamName: a.teamName,
          // 바이 경기에서 승리한 팀의 점수 설정
          ...(a.isBye ? {} : { score: 6 }),
          sets: [{ _key: `${key}_team1_set1`, setNumber: 1, games: a.isBye ? 0 : 6, players: [] }],
        },
        team2: {
          teamId: b.teamId,
          teamName: b.teamName,
          // 바이 경기에서 패배한 팀의 점수 설정
          ...(b.isBye ? {} : { score: 0 }),
          sets: [{ _key: `${key}_team2_set1`, setNumber: 1, games: b.isBye ? 0 : 6, players: [] }],
        },
        status: 'completed',
        winner: winner.teamId || undefined,
      });
      continue;
    }

    // 정상 매치
    console.log(`  -> 정상 경기 생성`);
    matches.push({
      _key: key,
      round,
      matchNumber: matchNumber++,
      team1: {
        teamId: a.teamId,
        teamName: a.teamName,
        sets: [{ _key: `${key}_team1_set1`, setNumber: 1, games: 0, players: [] }],
      },
      team2: {
        teamId: b.teamId,
        teamName: b.teamName,
        sets: [{ _key: `${key}_team2_set1`, setNumber: 1, games: 0, players: [] }],
      },
      status: 'scheduled',
    });
  }

  console.log('최종 생성된 매치 수:', matches.length);
  return matches;
}
