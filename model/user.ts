export interface User {
  _id?: string;
  _type: 'user';
  name: string;
  phone: string;
  gender: string;
  birth: string;
  score: number;
  email: string;
  level: number;
  address?: string;
  clubs?: { _key: string; _ref: string; name?: string }[]; // 클럽
  isApprovedUser?: boolean;
  isActive?: boolean; // 활동 상태
  deactivatedAt?: string; // 탈퇴 시각
  deactivatedReason?: string; // 탈퇴 사유
  kakaoAccessToken?: string; // 카카오 액세스 토큰
  _createdAt?: string;
}
