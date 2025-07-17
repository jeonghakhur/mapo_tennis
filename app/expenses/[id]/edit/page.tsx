'use client';
import { useState, useEffect } from 'react';
import { Box, Text, Button, TextField, Select, Flex } from '@radix-ui/themes';
import { useRouter } from 'next/navigation';
import type { Expense } from '@/model/expense';
import React from 'react';
import { categoryOptions, extractAmountFromText } from '@/lib/expenseUtils';
import { urlFor } from '@/sanity/lib/image';

export default function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [form, setForm] = useState({
    title: '',
    storeName: '',
    address: '',
    amount: '',
    category: '',
    date: '',
    description: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const [expense, setExpense] = useState<Expense | null>(null); // 추가: 원본 expense 저장
  const [showImage, setShowImage] = useState(true); // 이미지 미리보기 표시 여부

  useEffect(() => {
    const fetchExpense = async () => {
      try {
        const response = await fetch(`/api/expenses/${id}`);
        if (!response.ok) {
          throw new Error('지출내역을 찾을 수 없습니다.');
        }
        const expense: Expense = await response.json();
        setExpense(expense); // 원본 expense 저장
        setForm({
          title: expense.title,
          storeName: expense.storeName || '',
          address: expense.address || '',
          amount: String(expense.amount),
          category: expense.category,
          date: expense.date,
          description: expense.description || '',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : '지출내역을 불러올 수 없습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchExpense();
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    // 금액 필드인 경우 원화 기호 및 달러 처리
    if (name === 'amount') {
      const extractedAmount = extractAmountFromText(value);
      if (extractedAmount !== null) {
        // 달러로 입력된 경우 사용자에게 알림
        if (value.includes('$') || value.includes('USD')) {
          alert(`달러가 원화로 변환되었습니다: ${value} → ${extractedAmount.toLocaleString()}원`);
        }
        setForm((f) => ({ ...f, [name]: String(extractedAmount) }));
      } else {
        setForm((f) => ({ ...f, [name]: value }));
      }
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.title || !form.amount || !form.category || form.category === '' || !form.date) {
      setError('필수 항목을 입력하세요.');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('storeName', form.storeName);
      formData.append('address', form.address);
      formData.append('amount', form.amount);
      formData.append('category', form.category);
      formData.append('date', form.date);
      formData.append('description', form.description);

      const response = await fetch(`/api/expenses/${id}`, {
        method: 'PUT',
        body: formData,
      });

      if (response.ok) {
        alert('지출내역이 수정되었습니다.');
        router.push(`/expenses/${id}`);
      } else {
        const data = await response.json();
        setError(data.error || '수정 실패');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '수정 중 오류 발생');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('정말로 이 지출내역을 삭제하시겠습니까?')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('지출내역이 삭제되었습니다.');
        router.push('/expenses');
      } else {
        const data = await response.json();
        setError(data.error || '삭제 실패');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제 중 오류 발생');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Box className="max-w-lg mx-auto mt-8 p-6">
        <Text>로딩 중...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="max-w-lg mx-auto mt-8 p-6">
        <Text color="red">{error}</Text>
        <Button onClick={() => router.push('/expenses')} mt="3">
          목록으로 돌아가기
        </Button>
      </Box>
    );
  }

  return (
    <Box className="max-w-lg mx-auto mt-8 p-6 border rounded-lg bg-white">
      <Flex justify="between" align="center" mb="4">
        <Text size="6" weight="bold">
          지출내역 수정
        </Text>
        <Button variant="soft" color="red" onClick={handleDelete} disabled={deleting}>
          {deleting ? '삭제 중...' : '삭제'}
        </Button>
      </Flex>

      {/* 기존 영수증 이미지 미리보기 */}
      {expense?.receiptImage && showImage && (
        <div style={{ marginBottom: 16 }}>
          <Text weight="bold" size="3" color="gray" mb="2">
            기존 영수증 이미지
          </Text>
          <Box className="border rounded-lg overflow-hidden mb-2">
            <img
              src={urlFor(expense.receiptImage).url()}
              alt="영수증"
              style={{ width: '100%', height: 'auto', objectFit: 'cover', maxHeight: 300 }}
            />
          </Box>
          <Button size="2" color="red" variant="soft" onClick={() => setShowImage(false)}>
            이미지 숨기기
          </Button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Flex direction="column" gap="3">
          <div>
            <Text weight="bold">제목 *</Text>
            <TextField.Root name="title" value={form.title} onChange={handleChange} required />
          </div>

          <div>
            <Text weight="bold">매장명</Text>
            <TextField.Root name="storeName" value={form.storeName} onChange={handleChange} />
          </div>

          <div>
            <Text weight="bold">주소</Text>
            <TextField.Root name="address" value={form.address} onChange={handleChange} />
          </div>

          <div>
            <Text weight="bold">금액 *</Text>
            <TextField.Root
              name="amount"
              value={form.amount}
              onChange={handleChange}
              required
              placeholder="예: 15,000원, 15000, $15, $15.50"
              min="0"
            />
          </div>

          <div>
            <Text weight="bold">카테고리 *</Text>
            <Select.Root
              value={form.category}
              onValueChange={(v: string) => setForm((f) => ({ ...f, category: v }))}
            >
              <Select.Trigger placeholder="카테고리 선택" />
              <Select.Content>
                {categoryOptions.map((opt) => (
                  <Select.Item key={opt.value} value={opt.value}>
                    {opt.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </div>

          <div>
            <Text weight="bold">지출일 *</Text>
            <TextField.Root
              name="date"
              value={form.date}
              onChange={handleChange}
              required
              type="date"
            />
          </div>

          <div>
            <Text weight="bold">설명</Text>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full border rounded p-2"
              placeholder="지출에 대한 추가 설명을 입력하세요"
            />
          </div>

          {error && <Text color="red">{error}</Text>}

          <Flex gap="2" mt="4">
            <Button type="submit" size="3" disabled={saving} style={{ flex: 1 }}>
              {saving ? '저장 중...' : '저장'}
            </Button>
            <Button
              type="button"
              variant="soft"
              size="3"
              onClick={() => router.push(`/expenses/${id}`)}
              style={{ flex: 1 }}
            >
              취소
            </Button>
          </Flex>
        </Flex>
      </form>
    </Box>
  );
}
