import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/sanity/lib/client';
import { getExpense, updateExpense, deleteExpense } from '@/service/expense';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
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
  const expenseType = formData.get('expenseType') as string | null;
  const date = formData.get('date') as string;
  const description = formData.get('description') as string;
  const receiptImageFile = formData.get('receiptImage') as File | null;
  const removeReceiptImage = formData.get('removeReceiptImage') as string | null;

  if (!title || !amount || !category || !date) {
    throw new Error('필수 필드가 누락되었습니다.');
  }

  return {
    title,
    storeName,
    address,
    amount,
    expenseType: expenseType || undefined,
    category: category as ExpenseCategory,
    date,
    description,
    receiptImageFile,
    removeReceiptImage: !!removeReceiptImage,
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

    const updateData: Partial<ExpenseInput> = {
      title: parsedData.title,
      storeName: parsedData.storeName || undefined,
      address: parsedData.address || undefined,
      amount: parsedData.amount,
      expenseType: parsedData.expenseType as ExpenseInput['expenseType'],
      category: parsedData.category,
      date: parsedData.date,
      description: parsedData.description || undefined,
    };

    // 새 이미지 업로드 시 Sanity에 업로드 후 참조 저장
    if (parsedData.receiptImageFile && typeof parsedData.receiptImageFile === 'object') {
      const asset = await client.assets.upload('image', parsedData.receiptImageFile, {
        filename: parsedData.receiptImageFile.name,
      });
      updateData.receiptImage = { asset: { _type: 'reference' as const, _ref: asset._id } };
    }

    let expense = await updateExpense(id, updateData);

    // 삭제 플래그 처리 (새 이미지가 없을 때만 언셋)
    const unsetFields: string[] = [];
    if (parsedData.removeReceiptImage && !updateData.receiptImage) unsetFields.push('receiptImage');
    if (unsetFields.length > 0) {
      expense = await client.patch(id).unset(unsetFields).commit();
    }

    // 지출내역 수정 알림 생성 (관리자만 받음)
    if (expense._id) {
      const { title } = createNotificationMessage('UPDATE', 'EXPENSE', expense.title);

      // 상세한 지출내역 수정 메시지 생성
      const detailedMessage = `지출내역이 수정되었습니다.\n\n제목: ${expense.title}\n금액: ${expense.amount.toLocaleString()}원\n카테고리: ${expense.category}\n날짜: ${expense.date}\n매장명: ${expense.storeName || '미입력'}`;

      await createNotification({
        type: 'UPDATE',
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
    const message = error instanceof Error ? error.message : '지출내역을 수정할 수 없습니다.';
    return createErrorResponse(message, message.includes('로그인') ? 401 : 400);
  }
}

// 지출내역 삭제
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await checkAuth();
    const { id } = await params;

    // 삭제 전 지출내역 정보 조회
    const expense = await getExpense(id);
    if (!expense) {
      return createErrorResponse('지출내역을 찾을 수 없습니다.', 404);
    }

    await deleteExpense(id);

    // 지출내역 삭제 알림 생성 (관리자만 받음)
    const { title } = createNotificationMessage('DELETE', 'EXPENSE', expense.title);

    // 상세한 지출내역 삭제 메시지 생성
    const detailedMessage = `지출내역이 삭제되었습니다.\n\n제목: ${expense.title}\n금액: ${expense.amount.toLocaleString()}원\n카테고리: ${expense.category}\n날짜: ${expense.date}`;

    await createNotification({
      type: 'DELETE',
      entityType: 'EXPENSE',
      entityId: id,
      title,
      message: detailedMessage,
      requiredLevel: 5, // 레벨 5 (어드민)만 알림 수신
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : '지출내역을 삭제할 수 없습니다.';
    return createErrorResponse(message, message.includes('로그인') ? 401 : 500);
  }
}
