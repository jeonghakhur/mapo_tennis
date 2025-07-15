export interface Expense {
  _id: string;
  _type: 'expense';
  title: string;
  storeName?: string;
  address?: string;
  amount: number;
  category:
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
    | 'other';
  date: string;
  description?: string;
  receiptImage?: {
    asset: {
      _ref: string;
      _type: 'reference';
    };
    hotspot?: {
      x: number;
      y: number;
      height: number;
      width: number;
    };
    crop?: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    };
  };
  extractedText?: string;
  author: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ExpenseInput {
  title: string;
  storeName?: string;
  address?: string;
  amount: number;
  category:
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
    | 'other';
  date: string;
  description?: string;
  receiptImage?: File;
  author: string;
}
