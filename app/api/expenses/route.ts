import { NextRequest, NextResponse } from 'next/server';
import { getExpenses, createExpense } from '@/service/expense';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { client } from '@/sanity/lib/client';

// 지출내역 목록 조회
export async function GET() {
  try {
    const expenses = await getExpenses();
    return NextResponse.json(expenses);
  } catch (error) {
    console.error('지출내역 조회 실패:', error);
    return NextResponse.json({ error: '지출내역을 불러올 수 없습니다.' }, { status: 500 });
  }
}

// 지출내역 생성
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.name) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const formData = await req.formData();
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
      return NextResponse.json({ error: '필수 필드가 누락되었습니다.' }, { status: 400 });
    }

    let receiptImageSanity = undefined;
    if (receiptImageFile && typeof receiptImageFile === 'object') {
      // Sanity에 이미지 업로드
      const asset = await client.assets.upload('image', receiptImageFile, {
        filename: receiptImageFile.name,
      });
      receiptImageSanity = {
        asset: {
          _type: 'reference' as const,
          _ref: asset._id,
        },
      };
    }

    const expenseData = {
      title,
      storeName: storeName || undefined,
      address: address || undefined,
      amount,
      category: category as
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
        | 'other',
      date,
      description: description || undefined,
      author: session.user.name,
      receiptImage: receiptImageSanity,
      extractedText: extractedText || undefined,
    };

    const expense = await createExpense(expenseData);

    return NextResponse.json(expense);
  } catch (error) {
    console.error('지출내역 생성 실패:', error);
    return NextResponse.json({ error: '지출내역을 생성할 수 없습니다.' }, { status: 500 });
  }
}
