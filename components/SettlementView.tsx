
import React from 'react';
import { Debt, User } from '../types';

interface SettlementViewProps {
  debts: Debt[];
  users: User[];
  onSettle?: (from: string, to: string, amount: number) => void;
}

export const SettlementView: React.FC<SettlementViewProps> = ({ debts, users, onSettle }) => {
  if (debts.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="text-4xl mb-2">🎉</div>
        <p className="text-slate-500">All settled up!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {debts.map((debt, idx) => {
        const fromUser = users.find(u => u.id === debt.from);
        const toUser = users.find(u => u.id === debt.to);
        return (
          <div key={idx} className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={fromUser?.avatar} className="w-8 h-8 rounded-full border-2 border-white shadow-sm" alt="" />
              <span className="text-slate-400">→</span>
              <img src={toUser?.avatar} className="w-8 h-8 rounded-full border-2 border-white shadow-sm" alt="" />
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 font-medium">
                <span className="text-slate-800 font-semibold">{fromUser?.name || 'User'}</span> owes <span className="text-slate-800 font-semibold">{toUser?.name || 'User'}</span>
              </p>
              <p className="text-lg font-bold text-emerald-700">﷼ {debt.amount.toFixed(2)}</p>
            </div>

            {onSettle && (
              <button
                onClick={() => onSettle(debt.from, debt.to, debt.amount)}
                className="ml-4 bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm active:scale-95"
              >
                Mark Paid
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};
