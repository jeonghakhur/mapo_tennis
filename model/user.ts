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
  clubs?: { _key: string; _ref: string; _type: 'reference' }[]; // 클럽 참조 배열
}
