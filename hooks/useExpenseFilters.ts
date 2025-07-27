import { useState, useMemo } from 'react';
import type { Expense } from '@/model/expense';

interface UseExpenseFiltersOptions {
  expenses: Expense[];
  startDate?: string;
  endDate?: string;
}

interface UseExpenseFiltersReturn {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  categoryFilter: string;
  setCategoryFilter: (category: string) => void;
  sortBy: 'date' | 'amount' | 'title' | 'createdAt';
  setSortBy: (sortBy: 'date' | 'amount' | 'title' | 'createdAt') => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (order: 'asc' | 'desc') => void;
  filteredExpenses: Expense[];
  totalAmount: number;
}

type SortField = 'date' | 'amount' | 'title' | 'createdAt';

export function useExpenseFilters({
  expenses,
  startDate = '',
  endDate = '',
}: UseExpenseFiltersOptions): UseExpenseFiltersReturn {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredExpenses = useMemo(() => {
    let filtered = expenses;

    // 검색어 필터링
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (expense) =>
          expense.title.toLowerCase().includes(searchLower) ||
          expense.description?.toLowerCase().includes(searchLower) ||
          expense.author.toLowerCase().includes(searchLower),
      );
    }

    // 카테고리 필터링
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((expense) => expense.category === categoryFilter);
    }

    // 기간 필터링 추가
    if (startDate) {
      const startDateObj = new Date(startDate);
      startDateObj.setHours(0, 0, 0, 0); // 시작일의 시작 시간으로 설정
      filtered = filtered.filter((expense) => new Date(expense.date) >= startDateObj);
    }

    if (endDate) {
      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999); // 종료일의 마지막 시간으로 설정
      filtered = filtered.filter((expense) => new Date(expense.date) <= endDateObj);
    }

    // 정렬
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case 'date':
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [expenses, searchTerm, categoryFilter, startDate, endDate, sortBy, sortOrder]);

  const totalAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [filteredExpenses]);

  return {
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    filteredExpenses,
    totalAmount,
  };
}
