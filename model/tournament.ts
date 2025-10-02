export interface Tournament {
  _id: string;
  _type: 'tournament';
  title: string;
  startDate: string;
  endDate: string;
  location: string;
  tournamentType: 'individual' | 'team'; // 개인전/단체전
  registrationStartDate?: string;
  registrationDeadline?: string;
  descriptionPostId?: string;
  rulesPostId?: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  isDraft: boolean;
  host?: string;
  organizer?: string;
  participants?: string;
  registrationMethod?: string; // 접수방법
  drawMethod?: string; // 대진추첨
  equipment?: string; // 대회사용구
  memo?: string; // 메모
  divisions?: Array<{
    _key: string; // Sanity Studio에서 필요한 고유 키
    division: string;
    teamCount: number;
    playerCount?: number; // 부서별 참가선수명수
    matchDates: string[];
    startTime: string;
    prizes: {
      first: string;
      second: string;
      third: string;
    };
  }>;
  entryFee?: number; // 참가비
  bankAccount?: string; // 입금계좌
  accountHolder?: string; // 예금주
  clubJoinDate?: string; // 클럽가입일
  openingCeremony?: {
    isHeld: boolean; // 개회식 진행 여부
    date?: string; // 개회식 날짜
    time?: string; // 개회식 시간
    location?: string; // 개회식 장소
  };
  _createdAt: string; // Sanity에서 자동 생성되는 생성일
  createdAt: string;
  updatedAt?: string;
  createdBy: string;
}

export interface TournamentFormData {
  title: string;
  startDate: string;
  endDate: string;
  location: string;
  tournamentType: 'individual' | 'team'; // 개인전/단체전
  registrationStartDate?: string;
  registrationDeadline?: string;
  descriptionPostId?: string | null;
  rulesPostId?: string | null;
  isDraft?: boolean;
  host?: string;
  organizer?: string;
  participants?: string;
  registrationMethod?: string; // 접수방법
  drawMethod?: string; // 대진추첨
  equipment?: string; // 대회사용구
  memo?: string; // 메모
  selectedDivisions?: string[]; // 선택된 참가부서 목록
  divisions?: Array<{
    _key: string; // Sanity Studio에서 필요한 고유 키
    division: string;
    teamCount: number;
    playerCount?: number; // 부서별 참가선수명수
    matchDates: string[];
    startTime: string;
    prizes: {
      first: string;
      second: string;
      third: string;
    };
  }>;
  entryFee?: number; // 참가비
  bankAccount?: string; // 입금계좌
  accountHolder?: string; // 예금주
  clubJoinDate?: string; // 클럽가입일
  openingCeremony?: {
    isHeld: boolean; // 개회식 진행 여부
    date?: string; // 개회식 날짜
    time?: string; // 개회식 시간
    location?: string; // 개회식 장소
  };
}
