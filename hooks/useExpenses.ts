import { useState, useCallback, useEffect } from 'react';
import type { Expense } from '@/model/expense';

interface UseExpensesOptions {
  autoFetch?: boolean;
}

interface UseExpensesReturn {
  expenses: Expense[];
  loading: boolean;
  error: string;
  fetchExpenses: () => Promise<void>;
  createExpense: (formData: FormData) => Promise<Expense>;
  updateExpense: (id: string, formData: FormData) => Promise<Expense>;
  deleteExpense: (id: string) => Promise<void>;
}

interface UseExpenseReturn {
  expense: Expense | null;
  loading: boolean;
  error: string;
  fetchExpense: () => Promise<void>;
}

// 공통 에러 처리 함수
const handleApiError = (error: unknown, defaultMessage: string): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return defaultMessage;
};

// API 요청 헬퍼 함수
const apiRequest = async <T>(
  url: string,
  options: RequestInit = {},
  errorMessage: string,
): Promise<T> => {
  const response = await fetch(url, options);
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || errorMessage);
  }
  return response.json();
};

export function useExpenses(options: UseExpensesOptions = {}): UseExpensesReturn {
  const { autoFetch = true } = options;
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiRequest<Expense[]>(
        '/api/expenses',
        {},
        '지출내역을 불러올 수 없습니다.',
      );
      setExpenses(data);
    } catch (error) {
      const message = handleApiError(error, '오류가 발생했습니다.');
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createExpense = useCallback(async (formData: FormData): Promise<Expense> => {
    try {
      setLoading(true);
      setError('');
      const newExpense = await apiRequest<Expense>(
        '/api/expenses',
        { method: 'POST', body: formData },
        '저장 실패',
      );
      setExpenses((prev) => [newExpense, ...prev]);
      return newExpense;
    } catch (error) {
      const message = handleApiError(error, '저장 중 오류 발생');
      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateExpense = useCallback(async (id: string, formData: FormData): Promise<Expense> => {
    try {
      setLoading(true);
      setError('');
      const updatedExpense = await apiRequest<Expense>(
        `/api/expenses/${id}`,
        { method: 'PUT', body: formData },
        '수정 실패',
      );
      setExpenses((prev) => prev.map((expense) => (expense._id === id ? updatedExpense : expense)));
      return updatedExpense;
    } catch (error) {
      const message = handleApiError(error, '수정 중 오류 발생');
      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteExpense = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError('');
      await apiRequest(`/api/expenses/${id}`, { method: 'DELETE' }, '삭제 실패');
      setExpenses((prev) => prev.filter((expense) => expense._id !== id));
    } catch (error) {
      const message = handleApiError(error, '삭제 중 오류 발생');
      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchExpenses();
    }
  }, [autoFetch, fetchExpenses]);

  return {
    expenses,
    loading,
    error,
    fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
  };
}

export function useExpense(id: string): UseExpenseReturn {
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchExpense = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiRequest<Expense>(
        `/api/expenses/${id}`,
        {},
        '지출내역을 찾을 수 없습니다.',
      );
      setExpense(data);
    } catch (error) {
      const message = handleApiError(error, '지출내역을 불러올 수 없습니다.');
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchExpense();
  }, [fetchExpense]);

  return {
    expense,
    loading,
    error,
    fetchExpense,
  };
}
