// 대회 참가 신청 모델
export interface TournamentApplication {
  _id?: string;
  _type: 'tournamentApplication';
  tournamentId: string; // 참가할 대회 ID
  division: string; // 참가부서 (master, challenger, futures, chrysanthemum, forsythia)
  tournamentType: 'individual' | 'team'; // 대회 유형

  // 모든 대회 유형에서 teamMembers 사용
  // 개인전: 2명, 단체전: 6-8명
  teamMembers: Array<{
    name: string;
    clubId: string;
    clubName: string;
    birth?: string;
    score?: number;
    isRegisteredMember: boolean; // 등록된 회원인지 여부
    isInfoValid?: boolean; // 참가자 정보 검증 여부
  }>;

  // 신청 정보

  status: 'pending' | 'approved' | 'rejected' | 'cancelled'; // 신청 상태
  memo?: string; // 메모
  isFeePaid: boolean; // 참가비 납부 여부

  // 메타데이터
  createdAt: string;
  updatedAt?: string;
  createdBy: string; // 신청자 ID

  // 대회 정보 (API에서 조인된 데이터)
  tournament?: {
    _id: string;
    title: string;
    location: string;
    startDate: string;
    endDate: string;
  };

  // 신청자 정보 (API에서 조인된 데이터)
  applicant?: {
    _id: string;
    name: string;
    email: string;
  };

  // 해당 대회의 해당 부서에서 몇 번째 신청인지 (API에서 계산된 값)
  applicationOrder?: number;
}

// 참가 신청 입력용 데이터
export interface TournamentApplicationInput {
  tournamentId: string;
  division: string;
  tournamentType: 'individual' | 'team';
  teamMembers: Array<{
    name: string;
    clubId: string;
    clubName: string;
    birth?: string;
    score?: number;
    isRegisteredMember: boolean;
    isInfoValid?: boolean;
  }>;

  memo?: string;
  isFeePaid: boolean;
}
