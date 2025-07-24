export interface Award {
  _id: string;
  _type: 'award';
  competition: string;
  year: number;
  division: string; // 사용자가 직접 입력 가능
  awardCategory: '우승' | '준우승' | '3위' | '공동3위';
  players: string[];
  club: string;
  order: number;
  _createdAt: string;
  _updatedAt: string;
  _rev: string;
}

export interface AwardInput {
  competition: string;
  year: number;
  division: string; // 사용자가 직접 입력 가능
  awardCategory: '우승' | '준우승' | '3위' | '공동3위';
  players: string[];
  club: string;
  order: number;
}

// 부서 구분 상수 (참고용)
export const DIVISION_TYPES = {
  MASTER: '마스터부',
  CHALLENGER: '챌린저부',
  FUTURES: '퓨처스부',
  CHRYSANTHEMUM: '국화부',
  FORSYTHIA: '개나리부',
} as const;
