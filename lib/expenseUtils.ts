// 지출내역 관련 공통 유틸리티 함수들

export const categoryOptions = [
  { value: 'court_rental', label: '코트 대여료' },
  { value: 'equipment', label: '장비 구매' },
  { value: 'maintenance', label: '시설 유지보수' },
  { value: 'utilities', label: '공과금' },
  { value: 'insurance', label: '보험료' },
  { value: 'marketing', label: '홍보/마케팅' },
  { value: 'staff', label: '인건비' },
  { value: 'office', label: '사무용품' },
  { value: 'medical', label: '구급약' },
  { value: 'cleaning', label: '청소/위생' },
  { value: 'food', label: '식비/음료' },
  { value: 'transport', label: '교통비' },
  { value: 'event', label: '행사' },
  { value: 'other', label: '기타' },
] as const;

export const categoryLabels: Record<string, string> = {
  court_rental: '코트 대여료',
  equipment: '장비 구매',
  maintenance: '시설 유지보수',
  utilities: '공과금',
  insurance: '보험료',
  marketing: '홍보/마케팅',
  staff: '인건비',
  office: '사무용품',
  cleaning: '청소/위생',
  food: '식비/음료',
  transport: '교통비',
  event: '행사',
  other: '기타',
};

export const categoryColors: Record<
  string,
  'red' | 'blue' | 'green' | 'yellow' | 'orange' | 'purple' | 'pink' | 'gray'
> = {
  court_rental: 'blue',
  equipment: 'green',
  maintenance: 'orange',
  utilities: 'yellow',
  insurance: 'purple',
  marketing: 'pink',
  staff: 'red',
  office: 'gray',
  cleaning: 'green',
  food: 'orange',
  transport: 'blue',
  event: 'purple',
  other: 'gray',
};

// 금액 포맷팅 함수
export function formatAmount(amount: number): string {
  return amount.toLocaleString('ko-KR');
}

// 날짜 포맷팅 함수
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// 텍스트에서 금액 추출 함수
export function extractAmountFromText(text: string): number | null {
  if (!text) return null;

  // 원화 기호 제거 및 숫자만 추출
  const cleanText = text.replace(/[^\d,]/g, '');
  const amount = parseInt(cleanText.replace(/,/g, ''));

  if (isNaN(amount) || amount <= 0) {
    return null;
  }

  return amount;
}

// 달러를 원화로 변환하는 함수 (대략적인 환율 적용)
export function convertDollarToWon(dollarAmount: number): number {
  // 대략적인 환율 (실제로는 API를 통해 실시간 환율을 가져와야 함)
  const exchangeRate = 1300;
  return Math.round(dollarAmount * exchangeRate);
}

// 카테고리별 색상 가져오기
export function getCategoryColor(category: string): string {
  return categoryColors[category] || 'gray';
}

// 카테고리별 라벨 가져오기
export function getCategoryLabel(category: string): string {
  return categoryLabels[category] || '기타';
}

// 금액 유효성 검사
export function isValidAmount(amount: string): boolean {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0;
}

// 날짜 유효성 검사
export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}
