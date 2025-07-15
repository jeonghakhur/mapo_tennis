import { NextRequest, NextResponse } from 'next/server';
import { getExpenses, createExpense } from '@/service/expense';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

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

    if (!title || !amount || !category || !date) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다.' }, { status: 400 });
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
    };

    const expense = await createExpense(expenseData);

    return NextResponse.json(expense);
  } catch (error) {
    console.error('지출내역 생성 실패:', error);
    return NextResponse.json({ error: '지출내역을 생성할 수 없습니다.' }, { status: 500 });
  }
}
