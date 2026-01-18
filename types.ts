
export enum Category {
  RENT = 'Rent',
  GROCERIES = 'Groceries',
  UTILITIES = 'Utilities',
  ENTERTAINMENT = 'Entertainment',
  OTHER = 'Other'
}

export interface User {
  id: string;
  name: string;
  avatar: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  date: string;
  paidBy: string; // User ID
  splitWith: string[]; // Array of User IDs
  category: Category;
  receiptUrl?: string;
}

export interface Budget {
  category: Category;
  limit: number;
}

export interface Debt {
  from: string;
  to: string;
  amount: number;
}

// A recorded settlement transfer between roommates (or roommate -> admin).
// This is used to adjust current balances and can be undone if recorded by mistake.
export interface SettlementPayment {
  id: string;
  from: string;
  to: string;
  amount: number;
  date: string; // ISO timestamp
}

export interface MonthlyHistory {
  month: string; // "YYYY-MM"
  expenses: Expense[];
  settlementPayments: SettlementPayment[];
  totalSpend: number;
  finalDebts: Debt[];
}
