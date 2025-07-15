import OpenAI from 'openai';
import sharp from 'sharp';

export interface ExtractedExpenseData {
  amount?: number;
  date?: string;
  store?: string;
  address?: string;
  category?: string;
  items?: string[];
}

// OpenAI 클라이언트 초기화 (서버 사이드에서만 사용)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your_api_key_here',
  dangerouslyAllowBrowser: false, // 브라우저에서 사용 금지
});

export async function analyzeReceiptWithGPT(
  imageFile: File,
  customPrompt?: string,
): Promise<ExtractedExpenseData> {
  try {
    // 이미지 최적화
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const optimized = await sharp(buffer)
      .resize(1024, 1024, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({
        quality: 85,
        progressive: true,
      })
      .toBuffer();

    const metadata = await sharp(optimized).metadata();
    console.log(
      `이미지 최적화 완료: ${metadata.width}x${metadata.height}, ${(optimized.length / 1024).toFixed(1)}KB`,
    );

    // 최적화된 이미지를 base64로 변환
    const base64Image = optimized.toString('base64');

    // 기본 프롬프트 또는 사용자 정의 프롬프트 사용
    const defaultPrompt = `
    너는 테니스 클럽 회계 담당 AI입니다.
    영수증 이미지를 분석해서 지출 정보를 추출하고, 상호명을 기반으로 적절한 카테고리를 추천하세요.
    
    출력 포맷은 아래처럼 **JSON 구조로 고정**하고, 한국어 설명 없이 JSON만 반환하세요.
    
    {
      "amount": 10000,
      "date": "2025-06-13",
      "store": "GS25 망원스카이점",
      "address": "서울특별시 마포구 망원동 123-45",
      "category": "food",
      "items": [
        {
          "name": "음식물 5L*20",
          "quantity": 1,
          "price": 10000
        }
      ]
    }
    
    카테고리 분류 기준 (상호명을 기반으로 가장 적절한 것 하나만 선택):
    - "court_rental": 코트 대여료 (테니스장, 테니스클럽, 체육관, 스포츠센터, 체육회 등)
    - "equipment": 장비 구매 (스포츠용품, 테니스용품, 라켓샵, 윌슨, 바볼랫, 헤드, 요넥스 등)
    - "maintenance": 시설 유지보수 (정비, 수리, 유지보수, 시설관리 등)
    - "utilities": 공과금 (전기, 수도, 가스, 인터넷, 통신비 등)
    - "insurance": 보험료 (보험, 안전, 책임보험 등)
    - "marketing": 홍보/마케팅 (광고, 홍보, 마케팅, SNS, 인쇄물 등)
    - "staff": 인건비 (급여, 인건비, 용역, 알바 등)
    - "office": 사무용품 (문구점, 사무용품, 오피스, 인쇄, 복사 등)
    - "cleaning": 청소/위생 (청소, 위생, 소독, 정리 등)
    - "food": 식비/음료 (식당, 카페, 음식점, 레스토랑, 스타벅스, 배민 등)
    - "transport": 교통비 (택시, 버스, 지하철, 주차, 주유 등)
    - "event": 행사 (이벤트, 행사, 대회, 토너먼트, 경기, 축제 등)
    - "other": 기타 (위 카테고리에 해당하지 않는 모든 지출)
    
    조건:
    - 날짜는 YYYY-MM-DD 형식
    - 금액은 숫자만 (원화 기호 ￦, ₩, 원, KRW 등은 제거하고 숫자만 추출)
    - 달러($)로 표시된 금액이 있으면 해당 날짜의 환율로 환산해서 원화로 변환
    - 금액이 여러 개 있는 경우 가장 큰 금액을 총 금액으로 사용
    - store: 매장명/상호명 (영수증 상단이나 하단에 표시된 매장명)
    - address: 매장 주소 (영수증에 주소가 표시된 경우)
    - category: 상호명을 분석해서 가장 적절한 카테고리 선택 (반드시 위 13개 중 하나)
    - items 배열은 상품명이 실제로 보일 경우에만 name을 채움
    - 수량/단가는 보이면 포함, 없으면 생략
    - 항목이 인식되지 않으면 items를 빈 배열로 반환
    - 주소가 보이지 않으면 address는 빈 문자열로 반환
    - 설명 없이 JSON만 반환
    `;

    const prompt = customPrompt ? `${customPrompt}\n\n${defaultPrompt}` : defaultPrompt;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('GPT 응답을 받을 수 없습니다.');
    }

    console.log('GPT 응답:', content);

    // JSON 파싱 (더 안전한 방식)
    let parsedData;
    try {
      // 먼저 전체 응답을 JSON으로 파싱 시도
      parsedData = JSON.parse(content);
    } catch {
      // 실패하면 JSON 부분만 추출해서 파싱 시도
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('JSON 파싱 실패. 응답 내용:', content);
        throw new Error('JSON 형식의 응답을 받을 수 없습니다. 다른 프롬프트를 시도해보세요.');
      }
      try {
        parsedData = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error('JSON 파싱 오류:', parseError);
        throw new Error('응답을 파싱할 수 없습니다. 프롬프트를 수정해보세요.');
      }
    }

    return {
      amount: parsedData.amount ? parseInt(parsedData.amount) : undefined,
      date: parsedData.date,
      store: parsedData.store,
      address: parsedData.address,
      category: parsedData.category,
      items: parsedData.items || [],
    };
  } catch (error) {
    console.error('GPT Vision 분석 실패:', error);
    throw new Error('이미지 분석에 실패했습니다.');
  }
}
