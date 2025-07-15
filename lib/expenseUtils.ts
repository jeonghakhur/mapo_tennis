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
  { value: 'cleaning', label: '청소/위생' },
  { value: 'food', label: '식비/음료' },
  { value: 'transport', label: '교통비' },
  { value: 'event', label: '행사' },
  { value: 'other', label: '기타' },
];

export const categoryLabels = {
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

export const categoryColors = {
  court_rental: 'green',
  equipment: 'blue',
  maintenance: 'orange',
  utilities: 'yellow',
  insurance: 'red',
  marketing: 'purple',
  staff: 'pink',
  office: 'gray',
  cleaning: 'cyan',
  food: 'lime',
  transport: 'indigo',
  event: 'amber',
  other: 'gray',
} as const;

// GPT Vision 분석 결과를 기반으로 지출 제목 생성
export const generateExpenseTitle = () => {
  // 매장명은 별도 필드로 저장되므로 제목에서는 제거
  return '영수증 지출';
};

// 금액 포맷팅
export const formatAmount = (amount: number) => {
  return new Intl.NumberFormat('ko-KR').format(amount);
};

// 달러를 원화로 변환하는 함수
export const convertDollarToWon = (dollarAmount: number): number => {
  // 현재 환율 (1달러 = 1,300원) - 실제로는 API로 실시간 환율을 가져와야 함
  const exchangeRate = 1300;
  return Math.round(dollarAmount * exchangeRate);
};

// 원화 기호 제거 및 숫자만 추출 (달러 포함)
export const extractAmountFromText = (text: string): number | null => {
  // 달러 기호가 있는지 확인
  const dollarMatch = text.match(/\$?\s*([\d,]+\.?\d*)/);
  if (dollarMatch) {
    const dollarAmount = parseFloat(dollarMatch[1].replace(/,/g, ''));
    if (!isNaN(dollarAmount) && dollarAmount > 0) {
      return convertDollarToWon(dollarAmount);
    }
  }

  // 원화 기호와 쉼표 제거 후 숫자만 추출
  const cleanedText = text.replace(/[￦₩원\s,]/g, '');
  const amount = parseInt(cleanedText);

  // 유효한 숫자인지 확인
  if (isNaN(amount) || amount <= 0) {
    return null;
  }

  return amount;
};

// 여러 금액 중 가장 큰 금액 찾기
export const findLargestAmount = (amounts: (number | null)[]): number | null => {
  const validAmounts = amounts.filter((amount): amount is number => amount !== null && amount > 0);

  if (validAmounts.length === 0) {
    return null;
  }

  return Math.max(...validAmounts);
};

// 날짜 포맷팅
export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};
