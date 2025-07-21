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
  _createdAt?: string;
}
