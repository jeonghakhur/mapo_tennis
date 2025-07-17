import { NextRequest, NextResponse } from 'next/server';
import { getExpense, updateExpense, deleteExpense } from '@/service/expense';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
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
  };
};

// 지출내역 개별 조회
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const expense = await getExpense(id);
    if (!expense) {
      return createErrorResponse('지출내역을 찾을 수 없습니다.', 404);
    }
    return NextResponse.json(expense);
  } catch {
    return createErrorResponse('지출내역을 불러올 수 없습니다.');
  }
}

// 지출내역 수정
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await checkAuth();
    const { id } = await params;
    const formData = await req.formData();
    const parsedData = parseExpenseFormData(formData);

    const updateData = {
      title: parsedData.title,
      storeName: parsedData.storeName || undefined,
      address: parsedData.address || undefined,
      amount: parsedData.amount,
      category: parsedData.category,
      date: parsedData.date,
      description: parsedData.description || undefined,
    };

    const expense = await updateExpense(id, updateData);
    return NextResponse.json(expense);
  } catch (error) {
    const message = error instanceof Error ? error.message : '지출내역을 수정할 수 없습니다.';
    return createErrorResponse(message, message.includes('로그인') ? 401 : 400);
  }
}

// 지출내역 삭제
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await checkAuth();
    const { id } = await params;
    await deleteExpense(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : '지출내역을 삭제할 수 없습니다.';
    return createErrorResponse(message, message.includes('로그인') ? 401 : 500);
  }
}
