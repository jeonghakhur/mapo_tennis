// model/clubMember.ts

// 공통 필드
interface ClubMemberBase {
  user: string;
  role?: string;
  gender?: string;
  contact?: string;
  birth?: string;
  tennisStartYear?: string;
  email?: string;
  score?: number;
  isApproved?: boolean;
  joinedAt?: string;
  leftAt?: string;
  memo?: string;
  status?: string;
}

// 입력용: club은 reference
export interface ClubMemberInput extends ClubMemberBase {
  club: { _ref: string; _type: 'reference' };
  approvedByAdmin?: boolean;
}

// 조회용: club은 {_id, name}
export interface ClubMember extends ClubMemberBase {
  _id: string;
  club: { _id: string; name: string };
  approvedByAdmin?: boolean;
}
