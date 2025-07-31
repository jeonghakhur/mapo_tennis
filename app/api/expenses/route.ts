import { NextRequest, NextResponse } from 'next/server';
import { getExpenses, createExpense } from '@/service/expense';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { client } from '@/sanity/lib/client';
import { createNotification, createNotificationMessage } from '@/service/notification';
import { createNotificationLink } from '@/lib/notificationUtils';
import type { ExpenseInput } from '@/model/expense';

// 카테고리 타입 정의
type ExpenseCategory = ExpenseInput['category'];

// 공통 에러 응답 함수
const createErrorResponse = (message: string, status: number = 500) => {
  return NextResponse.json({ error: message }, { status });
};

// 인증 확인 함수
const checkAuth = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.name) {
    throw new Error('로그인이 필요합니다.');
  }
  return session.user.name;
};

// 폼 데이터 파싱 함수
const parseExpenseFormData = (formData: FormData) => {
  const title = formData.get('title') as string;
  const storeName = formData.get('storeName') as string;
  const address = formData.get('address') as string;
  const amount = parseInt(formData.get('amount') as string);
  const category = formData.get('category') as string;
  const date = formData.get('date') as string;
  const description = formData.get('description') as string;
  const extractedText = formData.get('extractedText') as string | undefined;
  const receiptImageFile = formData.get('receiptImage') as File | null;

  if (!title || !amount || !category || !date) {
    throw new Error('필수 필드가 누락되었습니다.');
  }

  return {
    title,
    storeName,
    address,
    amount,
    category: category as ExpenseCategory,
    date,
    description,
    extractedText,
    receiptImageFile,
  };
};

// 지출내역 목록 조회
export async function GET() {
  try {
    const expenses = await getExpenses();
    return NextResponse.json(expenses);
  } catch {
    return createErrorResponse('지출내역을 불러올 수 없습니다.');
  }
}

// 지출내역 생성
export async function POST(req: NextRequest) {
  try {
    const author = await checkAuth();
    const formData = await req.formData();
    const parsedData = parseExpenseFormData(formData);

    let receiptImageSanity = undefined;
    if (parsedData.receiptImageFile && typeof parsedData.receiptImageFile === 'object') {
      // Sanity에 이미지 업로드
      const asset = await client.assets.upload('image', parsedData.receiptImageFile, {
        filename: parsedData.receiptImageFile.name,
      });
      receiptImageSanity = {
        asset: {
          _type: 'reference' as const,
          _ref: asset._id,
        },
      };
    }

    const expenseData: ExpenseInput = {
      title: parsedData.title,
      storeName: parsedData.storeName || undefined,
      address: parsedData.address || undefined,
      amount: parsedData.amount,
      category: parsedData.category,
      date: parsedData.date,
      description: parsedData.description || undefined,
      author,
      receiptImage: receiptImageSanity,
      extractedText: parsedData.extractedText || undefined,
    };

    const expense = await createExpense(expenseData);

    // 지출내역 알림 생성 (관리자만 받음)
    if (expense._id) {
      const { title } = createNotificationMessage('CREATE', 'EXPENSE', expenseData.title);

      // 상세한 지출내역 메시지 생성
      const detailedMessage = `새로운 지출내역이 등록되었습니다.\n\n제목: ${expenseData.title}\n금액: ${expenseData.amount.toLocaleString()}원\n카테고리: ${expenseData.category}\n날짜: ${expenseData.date}\n매장명: ${expenseData.storeName || '미입력'}\n등록자: ${author}`;

      await createNotification({
        type: 'CREATE',
        entityType: 'EXPENSE',
        entityId: expense._id,
        title,
        message: detailedMessage,
        link: createNotificationLink('EXPENSE', expense._id),
        requiredLevel: 5, // 레벨 5 (어드민)만 알림 수신
      });
    }

    return NextResponse.json(expense);
  } catch (error) {
    const message = error instanceof Error ? error.message : '지출내역을 생성할 수 없습니다.';
    return createErrorResponse(message, message.includes('로그인') ? 401 : 400);
  }
}
