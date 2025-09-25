export interface Club {
  _id?: string;
  name: string;
  location?: string;
}

export interface ClubMember {
  _id: string;
  user: string;
  birth?: string;
  score?: number;
  club: {
    _id: string;
    name: string;
  };
}

// 조편성 관련 타입들
export interface Team {
  _id: string;
  name: string;
  division: string;
  members: Array<{
    _key: string;
    name: string;
    clubId: string;
    clubName: string;
    birth?: string;
    score?: number;
    isRegisteredMember: boolean;
  }>;
  seed?: number; // 시드 번호 (선택사항)
  createdAt: string;
}

export interface Group {
  groupId: string;
  name: string; // 예: "A조", "B조"
  teams: Team[];
  division: string;
  tournamentType?: string; // 개인전/단체전 정보
}

export interface SetScore {
  _key?: string; // Sanity 배열 항목의 고유 키
  setNumber: number;
  games: number;
  tiebreak?: number;
  players?: string[]; // 해당 세트에 참여한 선수명 배열 (최대 2명)
}

export interface Match {
  _id: string;
  tournamentId: string;
  division: string;
  groupId?: string; // 예선 경기인 경우
  round?: number; // 본선 라운드 (16강=1, 8강=2, 4강=3, 결승=4)
  matchNumber: number; // 경기 번호
  team1: {
    teamId: string;
    teamName: string;
    score?: number; // 기존 호환성을 위해 유지
    sets?: SetScore[]; // 새로운 세트별 점수 구조
    totalSetsWon?: number; // 승리한 세트 수
  };
  team2: {
    teamId: string;
    teamName: string;
    score?: number; // 기존 호환성을 위해 유지
    sets?: SetScore[]; // 새로운 세트별 점수 구조
    totalSetsWon?: number; // 승리한 세트 수
  };
  winner?: string; // 승자 팀 ID
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduledTime?: string;
  court?: string; // 코트 번호
  createdAt: string;
  updatedAt?: string;
}

export interface BracketMatch {
  _key: string;
  _id: string;
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
  tournamentId: string;
  division: string;
  groups: Group[]; // 예선 조
  matches: Match[]; // 모든 경기 (예선 + 본선)
  bracketType: 'single_elimination' | 'double_elimination';
  totalTeams: number;
  totalGroups: number;
  teamsPerGroup: number; // 조당 팀 수 (2 또는 3)
  advancingTeams: number; // 조별 진출 팀 수 (보통 2)
}

export interface GroupStanding {
  teamId: string;
  teamName: string;
  groupId?: string; // 조 ID (선택적)
  played: number; // 경기 수
  won: number; // 승리 수
  drawn: number; // 무승부 수
  lost: number; // 패배 수
  goalsFor: number; // 득점
  goalsAgainst: number; // 실점
  goalDifference: number; // 득실차
  points: number; // 승점
  position: number; // 순위
}

// 조편성 옵션
export interface GroupingOptions {
  method: 'random' | 'seeded' | 'manual';
  teamsPerGroup: 2 | 3; // 조당 팀 수
  seedCriteria?: 'registration_order' | 'previous_performance' | 'manual';
  avoidSameClub?: boolean; // 같은 클럽 팀 분리 여부
}

// 조편성 결과
export interface GroupingResult {
  groups: Group[];
  totalGroups: number;
  teamsPerGroup: number;
  remainingTeams: number; // 균등 분배 후 남은 팀 수
  distribution: {
    groupsWith3Teams: number;
    groupsWith2Teams: number;
  };
}

// 경기 결과
export interface MatchResult {
  matchId: string;
  team1Score: number;
  team2Score: number;
  winner: string; // 승자 팀 ID
  completedAt: string;
}

// 예선 결과
export interface GroupResult {
  groupId: string;
  standings: GroupStanding[];
  advancingTeams: string[]; // 진출 팀 ID 목록
}

// 본선 대진표 생성 옵션
export interface BracketOptions {
  method: 'random' | 'seeded';
  avoidSameGroup?: boolean; // 같은 조 1,2위 분리 여부
  seedByGroupPosition?: boolean; // 조 순위로 시드 배정
}

export interface ParticipantFormProps {
  label: string;
  participant: ParticipantHookReturn;
  clubs: Club[];
  isSharedClub?: boolean;
  sharedClubId?: string;
  isIndividual?: boolean;
}

export interface TeamMemberCountSelectorProps {
  teamMemberCount: number;
  onTeamMemberCountChange: (count: number) => void;
}

export interface TeamParticipantFormProps {
  participants: ParticipantHookReturn[];
  clubs: Club[];
  sharedClubId: string;
  onSharedClubChange: (clubId: string) => void;
  teamMemberCount: number;
  onTeamMemberCountChange: (count: number) => void;
}

export interface TournamentParticipationFormProps {
  availableDivisions: Array<{ value: string; label: string } | undefined>;
  division: string;
  setDivision: (value: string) => void;
  memo: string;
  setMemo: (value: string) => void;
  isFeePaid: boolean;
  setIsFeePaid: (value: boolean) => void;
  divisionRef: React.RefObject<HTMLDivElement | null>;
  isIndividual: boolean;
}

// useParticipant 훅의 반환 타입
export interface ParticipantHookReturn {
  name: string;
  setName: (value: string) => void;
  setNameDirect: (value: string) => void;
  clubId: string;
  setClubId: (clubId: string) => void;
  setClubIdDirect: (value: string) => void;
  setClubIdForced: (clubId: string) => void;
  birth: string;
  setBirth: (value: string) => void;
  setBirthDirect: (value: string) => void;
  score: string;
  setScore: (value: string) => void;
  setScoreDirect: (value: string) => void;
  isRegistered: boolean | null;
  setIsRegistered: (value: boolean | null) => void;
  setIsRegisteredDirect: (value: boolean) => void;
  nameRef: React.RefObject<HTMLInputElement | null>;
  clubRef: React.RefObject<HTMLDivElement | null>;
  birthRef: React.RefObject<HTMLInputElement | null>;
  scoreRef: React.RefObject<HTMLInputElement | null>;
  handleNameBlur: () => Promise<void>;
}

export interface MatchUpdateData {
  team1Score?: number;
  team2Score?: number;
  team1Sets?: SetScore[];
  team2Sets?: SetScore[];
  team1TotalSetsWon?: number; // 팀1 승리 세트 수
  team2TotalSetsWon?: number; // 팀2 승리 세트 수
  winner?: string; // 승자 팀 ID
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  court?: string;
}
