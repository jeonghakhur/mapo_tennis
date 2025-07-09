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
}
