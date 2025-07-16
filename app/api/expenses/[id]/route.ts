import { NextRequest, NextResponse } from 'next/server';
import { getExpense, updateExpense, deleteExpense } from '@/service/expense';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

// 지출내역 개별 조회
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const expense = await getExpense(id);
    if (!expense) {
      return NextResponse.json({ error: '지출내역을 찾을 수 없습니다.' }, { status: 404 });
    }
    return NextResponse.json(expense);
  } catch (error) {
    console.error('지출내역 조회 실패:', error);
    return NextResponse.json({ error: '지출내역을 불러올 수 없습니다.' }, { status: 500 });
  }
}

// 지출내역 수정
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.name) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { id } = await params;
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

    const updateData = {
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
    };

    const expense = await updateExpense(id, updateData);
    return NextResponse.json(expense);
  } catch (error) {
    console.error('지출내역 수정 실패:', error);
    return NextResponse.json({ error: '지출내역을 수정할 수 없습니다.' }, { status: 500 });
  }
}

// 지출내역 삭제
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.name) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { id } = await params;
    await deleteExpense(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('지출내역 삭제 실패:', error);
    return NextResponse.json({ error: '지출내역을 삭제할 수 없습니다.' }, { status: 500 });
  }
}
