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
    matchDates: string[];
    startTime: string;
    prizes: {
      first: number;
      second: number;
      third: number;
    };
  }>;
  entryFee?: number; // 참가비
  bankAccount?: string; // 입금계좌
  accountHolder?: string; // 예금주
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
    matchDates: string[];
    startTime: string;
    prizes: {
      first: number;
      second: number;
      third: number;
    };
  }>;
  entryFee?: number; // 참가비
  bankAccount?: string; // 입금계좌
  accountHolder?: string; // 예금주
}
