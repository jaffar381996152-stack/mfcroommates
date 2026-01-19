
export enum Category {
  Groceries = 'Groceries',
  Food = 'Food',
  Other = 'Other'
}

export interface Roommate {
  id: string;
  name: string;
  isAdmin: boolean;
  isSettled: boolean; // For previous month tracking
}

export interface Expense {
  id: string;
  payerId: string;
  amount: number;
  category: Category;
  date: string; // ISO string
}

export interface MonthlyData {
  monthKey: string; // e.g., "2023-10"
  expenses: Expense[];
  roommates: Roommate[];
  isSettled: boolean;
}

export interface AppState {
  currentMonth: string; // "YYYY-MM"
  roommates: Roommate[];
  expenses: Expense[];
  /** Manual adjustments (advance payments) used in settlements.
   *  Example: if roommate already paid 3 SAR to admin, store 3 here.
   */
  advances: Record<string, number>; // roommateId -> amount
  archive: MonthlyData[];
  settings: {
    currency: string;
    theme: 'light' | 'dark';
  };
}

export type View = 'Dashboard' | 'Analytics' | 'Settlements' | 'Roommates' | 'Settings' | 'Developer' | 'Archive';
