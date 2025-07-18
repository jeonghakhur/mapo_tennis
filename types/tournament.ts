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

export interface ParticipantFormProps {
  label: string;
  participant: ParticipantHookReturn;
  clubs: Club[];
  isSharedClub?: boolean;
  sharedClubId?: string;
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
  contact: string;
  setContact: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  memo: string;
  setMemo: (value: string) => void;
  isFeePaid: boolean;
  setIsFeePaid: (value: boolean) => void;
  divisionRef: React.RefObject<HTMLDivElement | null>;
  contactRef: React.RefObject<HTMLInputElement | null>;
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
