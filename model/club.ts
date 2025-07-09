export interface ClubMember {
  name: string;
  role?: string;
  birth?: string;
  gender?: string;
  joinedAt: string;
  leftAt?: string;
  isApproved: boolean;
  userRef?: { _type: 'reference'; _ref: string };
  contact?: string;
  memo?: string;
}

export interface Club {
  _id?: string;
  _type?: 'club';
  name: string;
  description: string;
  workDays?: string;
  location?: string;
  isPublic: boolean;
  contact?: string;
  image?: {
    _type: 'image';
    asset: { _type: 'reference'; _ref: string };
  };
  createdBy: { _type: 'reference'; _ref: string };
  members?: ClubMember[];
}
