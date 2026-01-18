
import React from 'react';
import { Expense, Category, User } from '../types';

interface ExpenseCardProps {
  expense: Expense;
  users: User[];
  onDelete?: (id: string) => void;
  onEdit?: (expense: Expense) => void;
}

const CategoryIcon = ({ category }: { category: Category }) => {
  switch (category) {
    case Category.RENT: return '🏠';
    case Category.GROCERIES: return '🛒';
    case Category.UTILITIES: return '⚡';
    case Category.ENTERTAINMENT: return '🎬';
    default: return '📦';
  }
};

export const ExpenseCard: React.FC<ExpenseCardProps> = ({ expense, users, onDelete, onEdit }) => {
  const payer = users.find(u => u.id === expense.paidBy);
  
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 mb-3">
      <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-2xl">
        <CategoryIcon category={expense.category} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-slate-800 truncate">{expense.title}</h4>
        <p className="text-xs text-slate-500">Paid by {payer?.name || 'Unknown'} • {new Date(expense.date).toLocaleDateString()}</p>
      </div>
      <div className="text-right">
        <div className="font-bold text-slate-900">﷼ {expense.amount.toFixed(2)}</div>
        <div className="text-[10px] text-slate-400 uppercase tracking-wider">{expense.category}</div>
      </div>

      {onEdit && (
        <button
          onClick={() => onEdit(expense)}
          className="ml-2 w-10 h-10 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 active:scale-95 transition-all flex items-center justify-center"
          aria-label="Edit expense"
          title="Edit"
        >
          ✏️
        </button>
      )}

      {onDelete && (
        <button
          onClick={() => onDelete(expense.id)}
          className="ml-2 w-10 h-10 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 active:scale-95 transition-all flex items-center justify-center"
          aria-label="Delete expense"
          title="Delete"
        >
          🗑️
        </button>
      )}
    </div>
  );
};
