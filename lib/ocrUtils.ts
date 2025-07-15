import Tesseract from 'tesseract.js';

export interface ExtractedExpenseData {
  amount?: number;
  date?: string;
  store?: string;
  items?: string[];
}

export async function extractTextFromImage(imageFile: File): Promise<string> {
  try {
    const result = await Tesseract.recognize(imageFile, 'kor+eng', {
      logger: (m) => console.log(m),
    });
    return result.data.text;
  } catch (error) {
    console.error('OCR 처리 실패:', error);
    throw new Error('이미지에서 텍스트를 추출할 수 없습니다.');
  }
}

export function parseExpenseData(text: string): ExtractedExpenseData {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const result: ExtractedExpenseData = {};

  // 금액 추출 (숫자 + 원 패턴)
  const amountRegex = /(\d{1,3}(,\d{3})*|\d+)원/g;
  const amounts: number[] = [];

  for (const line of lines) {
    const matches = line.match(amountRegex);
    if (matches) {
      for (const match of matches) {
        const amount = parseInt(match.replace(/[^\d]/g, ''));
        if (amount > 0) {
          amounts.push(amount);
        }
      }
    }
  }

  // 가장 큰 금액을 총 금액으로 간주
  if (amounts.length > 0) {
    result.amount = Math.max(...amounts);
  }

  // 날짜 추출 (YYYY-MM-DD, YYYY/MM/DD, MM/DD 등 패턴)
  const dateRegex = /(\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2})/g;
  for (const line of lines) {
    const match = line.match(dateRegex);
    if (match) {
      result.date = match[0];
      break;
    }
  }

  // 상점명 추출 (첫 번째 줄이나 특정 키워드가 있는 줄)
  const storeKeywords = ['매장', '상점', '점', '스토어', '마트', '편의점', '카페', '식당'];
  for (const line of lines) {
    for (const keyword of storeKeywords) {
      if (line.includes(keyword)) {
        result.store = line.replace(keyword, '').trim();
        break;
      }
    }
    if (result.store) break;
  }

  // 첫 번째 줄이 상점명일 가능성이 높음
  if (!result.store && lines.length > 0) {
    const firstLine = lines[0];
    if (firstLine.length > 0 && firstLine.length < 50) {
      result.store = firstLine;
    }
  }

  // 상품명 추출 (금액이 있는 줄에서 상품명 추출)
  const items: string[] = [];
  for (const line of lines) {
    if (line.includes('원') && !line.includes('총') && !line.includes('합계')) {
      const itemName = line.replace(/\d+원.*$/, '').trim();
      if (itemName.length > 0) {
        items.push(itemName);
      }
    }
  }

  if (items.length > 0) {
    result.items = items;
  }

  return result;
}

export function generateExpenseTitle(parsedData: ExtractedExpenseData): string {
  if (parsedData.store) {
    return `${parsedData.store} 지출`;
  }
  return '영수증 지출';
}

export function categorizeExpense(
  parsedData: ExtractedExpenseData,
):
  | 'court_rental'
  | 'equipment'
  | 'maintenance'
  | 'utilities'
  | 'insurance'
  | 'marketing'
  | 'staff'
  | 'office'
  | 'cleaning'
  | 'food'
  | 'transport'
  | 'event'
  | 'other' {
  const text = JSON.stringify(parsedData).toLowerCase();

  // 카테고리별 키워드
  const courtRentalKeywords = ['테니스', '코트', '체육관', '스포츠센터', '체육회', '테니스클럽'];
  const equipmentKeywords = [
    '스포츠용품',
    '테니스용품',
    '라켓',
    '윌슨',
    '바볼랫',
    '헤드',
    '요넥스',
    '장비',
  ];
  const maintenanceKeywords = ['정비', '수리', '유지보수', '시설관리', '정비소'];
  const utilitiesKeywords = ['전기', '수도', '가스', '인터넷', '통신비', '공과금'];
  const insuranceKeywords = ['보험', '안전', '책임보험', '보험료'];
  const marketingKeywords = ['광고', '홍보', '마케팅', 'sns', '인쇄물'];
  const staffKeywords = ['급여', '인건비', '용역', '알바', '인력'];
  const officeKeywords = ['문구점', '사무용품', '오피스', '인쇄', '복사'];
  const cleaningKeywords = ['청소', '위생', '소독', '정리', '청소용품'];
  const foodKeywords = ['식당', '카페', '음식', '점심', '저녁', '아침', '커피', '음료', '맛집'];
  const transportKeywords = ['교통', '버스', '지하철', '택시', '기차', '주차', '주유'];
  const eventKeywords = ['이벤트', '행사', '대회', '토너먼트', '경기', '축제', '행사장'];

  for (const keyword of courtRentalKeywords) {
    if (text.includes(keyword)) return 'court_rental';
  }
  for (const keyword of equipmentKeywords) {
    if (text.includes(keyword)) return 'equipment';
  }
  for (const keyword of maintenanceKeywords) {
    if (text.includes(keyword)) return 'maintenance';
  }
  for (const keyword of utilitiesKeywords) {
    if (text.includes(keyword)) return 'utilities';
  }
  for (const keyword of insuranceKeywords) {
    if (text.includes(keyword)) return 'insurance';
  }
  for (const keyword of marketingKeywords) {
    if (text.includes(keyword)) return 'marketing';
  }
  for (const keyword of staffKeywords) {
    if (text.includes(keyword)) return 'staff';
  }
  for (const keyword of officeKeywords) {
    if (text.includes(keyword)) return 'office';
  }
  for (const keyword of cleaningKeywords) {
    if (text.includes(keyword)) return 'cleaning';
  }
  for (const keyword of foodKeywords) {
    if (text.includes(keyword)) return 'food';
  }
  for (const keyword of transportKeywords) {
    if (text.includes(keyword)) return 'transport';
  }
  for (const keyword of eventKeywords) {
    if (text.includes(keyword)) return 'event';
  }

  return 'other';
}
