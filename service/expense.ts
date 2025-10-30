import { client } from '@/sanity/lib/client';
import type { Expense, ExpenseInput } from '@/model/expense';

// 지출내역 목록 조회
export async function getExpenses(): Promise<Expense[]> {
  return await client.fetch(`
    *[_type == "expense"]
    | order(date desc, createdAt desc)
  `);
}

// 지출내역 단일 조회
export async function getExpense(id: string): Promise<Expense | null> {
  return await client.fetch(
    `
    *[_type == "expense" && _id == $id][0] {
      ...,
      attachments[] {
        ...,
        asset-> {
          _id,
          _type,
          "originalFilename": originalFilename,
          "url": url,
          "mimeType": mimeType
        }
      }
    }
  `,
    { id },
  );
}

// 지출내역 생성
export async function createExpense(expenseData: ExpenseInput): Promise<Expense> {
  const doc = {
    _type: 'expense' as const,
    title: expenseData.title,
    storeName: expenseData.storeName,
    address: expenseData.address,
    amount: expenseData.amount,
    expenseType: expenseData.expenseType,
    category: expenseData.category,
    date: expenseData.date,
    description: expenseData.description,
    author: expenseData.author,
    createdAt: new Date().toISOString(),
    ...(expenseData.receiptImage &&
    typeof expenseData.receiptImage === 'object' &&
    'asset' in expenseData.receiptImage
      ? { receiptImage: expenseData.receiptImage }
      : {}),
    ...(expenseData.productImage &&
    typeof expenseData.productImage === 'object' &&
    'asset' in expenseData.productImage
      ? { productImage: expenseData.productImage }
      : {}),
    ...(expenseData.extractedText ? { extractedText: expenseData.extractedText } : {}),
    ...(expenseData.attachments && expenseData.attachments.length > 0
      ? { attachments: expenseData.attachments }
      : {}),
  };

  return (await client.create(doc)) as Expense;
}

// 지출내역 수정
export async function updateExpense(
  id: string,
  expenseData: Partial<ExpenseInput>,
): Promise<Expense> {
  const updateData = {
    ...expenseData,
    updatedAt: new Date().toISOString(),
  };

  return await client.patch(id).set(updateData).commit();
}

// 지출내역 삭제
export async function deleteExpense(id: string): Promise<void> {
  await client.delete(id);
}
