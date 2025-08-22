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
  matchData: Partial<BracketMatch>,
): Promise<boolean> {
  try {
    console.log('updateBracketMatch 시작:', { bracketId, matchKey, matchData });

    const bracket = await client.getDocument(bracketId);
    if (!bracket) {
      console.error('대진표를 찾을 수 없음:', bracketId);
      return false;
    }

    console.log('현재 대진표:', bracket);

    const updatedMatches = bracket.matches.map((match: BracketMatch) => {
      if (match._key === matchKey) {
        console.log('매치 업데이트:', { before: match, after: { ...match, ...matchData } });
        return { ...match, ...matchData };
      }
      return match;
    });

    console.log('업데이트된 매치들:', updatedMatches);

    await client
      .patch(bracketId)
      .set({
        matches: updatedMatches,
        updatedAt: new Date().toISOString(),
      })
      .commit();

    console.log('대진표 업데이트 완료');
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

  return roundMatches.every((match) => match.status === 'completed');
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
      const winningTeam = match.winner === 'team1' ? match.team1 : match.team2;

      // 바이 경기에서 승리한 팀인지 확인 (teamId가 있고 teamName이 'BYE'가 아닌 경우)
      const isByeWinner = winningTeam.teamId && winningTeam.teamName !== 'BYE';

      winningTeams.push({
        teamId: winningTeam.teamId,
        teamName: winningTeam.teamName,
        groupId: isByeWinner ? 'bye_winner' : 'unknown',
        position: 1, // 바이 승리자는 높은 시드
        points: isByeWinner ? 6 : 0, // 바이 승리자는 6점
        goalDifference: isByeWinner ? 6 : 0, // 바이 승리자는 +6 득실차
      });
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

/** 바이를 배정할 위치를 결정하는 함수 */
function getByePositions(size: number, byeCount: number): number[] {
  // 32강에서 바이 배정 위치 (표준 토너먼트 방식)
  if (size === 32) {
    if (byeCount === 22)
      return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]; // 10팀일 때
    if (byeCount === 21)
      return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]; // 11팀일 때
    if (byeCount === 20)
      return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]; // 12팀일 때
    if (byeCount === 19) return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]; // 13팀일 때
    if (byeCount === 18) return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]; // 14팀일 때
    if (byeCount === 17) return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]; // 15팀일 때
    if (byeCount === 16) return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]; // 16팀일 때
    if (byeCount === 15) return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]; // 17팀일 때
    if (byeCount === 14) return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]; // 18팀일 때
    if (byeCount === 13) return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]; // 19팀일 때
    if (byeCount === 12) return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]; // 20팀일 때
    if (byeCount === 11) return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]; // 21팀일 때
    if (byeCount === 10) return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // 22팀일 때
    if (byeCount === 9) return [1, 2, 3, 4, 5, 6, 7, 8, 9]; // 23팀일 때
    if (byeCount === 8) return [1, 2, 3, 4, 5, 6, 7, 8]; // 24팀일 때
    if (byeCount === 7) return [1, 2, 3, 4, 5, 6, 7]; // 25팀일 때
    if (byeCount === 6) return [1, 2, 3, 4, 5, 6]; // 26팀일 때
    if (byeCount === 5) return [1, 2, 3, 4, 5]; // 27팀일 때
    if (byeCount === 4) return [1, 2, 3, 4]; // 28팀일 때
    if (byeCount === 3) return [1, 2, 3]; // 29팀일 때
    if (byeCount === 2) return [1, 2]; // 30팀일 때
    if (byeCount === 1) return [1]; // 31팀일 때
    if (byeCount === 0) return []; // 32팀일 때 (바이 없음)
  }

  // 16강에서 바이 배정 위치 (표준 토너먼트 방식)
  if (size === 16) {
    if (byeCount === 6) return [1, 2, 3, 4, 5, 6]; // 10팀일 때
    if (byeCount === 5) return [1, 2, 3, 4, 5]; // 11팀일 때
    if (byeCount === 4) return [1, 2, 3, 4]; // 12팀일 때
    if (byeCount === 3) return [1, 2, 3]; // 13팀일 때
    if (byeCount === 2) return [1, 2]; // 14팀일 때
    if (byeCount === 1) return [1]; // 15팀일 때
    if (byeCount === 0) return []; // 16팀일 때 (바이 없음)
  }

  // 8강에서 바이 배정 위치
  if (size === 8) {
    if (byeCount === 3) return [1, 2, 3]; // 5팀일 때
    if (byeCount === 2) return [1, 2]; // 6팀일 때
    if (byeCount === 1) return [1]; // 7팀일 때
    if (byeCount === 0) return []; // 8팀일 때 (바이 없음)
  }

  // 4강에서 바이 배정 위치
  if (size === 4) {
    if (byeCount === 1) return [1]; // 3팀일 때
    if (byeCount === 0) return []; // 4팀일 때 (바이 없음)
  }

  // 기본: 뒤쪽부터 바이 배정
  const positions = [];
  for (let i = size - byeCount; i < size; i++) {
    positions.push(i);
  }
  return positions;
}

/** 표준 시드 포지션 생성 (1,2 / 1,4,3,2 / 1,8,5,4,3,6,7,2 ... 식) */
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
  const byePositions = getByePositions(bracketSize, byes);

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
      const loser = a.isBye ? a : b;
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
        },
        team2: {
          teamId: b.teamId,
          teamName: b.teamName,
          // 바이 경기에서 패배한 팀의 점수 설정
          ...(b.isBye ? {} : { score: 0 }),
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
      team1: { teamId: a.teamId, teamName: a.teamName },
      team2: { teamId: b.teamId, teamName: b.teamName },
      status: 'scheduled',
    });
  }

  console.log('최종 생성된 매치 수:', matches.length);
  return matches;
}
