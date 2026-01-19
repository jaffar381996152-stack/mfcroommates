
import React from 'react';
import { MonthlyData } from '../types';
import { calculateSettlements, formatCurrency } from '../utils';
import { CheckCircle, Clock, ChevronDown, Trash2 } from 'lucide-react';

interface ArchiveProps {
  archive: MonthlyData[];
  onSettle: (monthKey: string) => void;
  onDelete: (monthKey: string) => void;
}

const Archive: React.FC<ArchiveProps> = ({ archive, onSettle, onDelete }) => {
  if (archive.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-300 space-y-4">
        <Clock size={48} strokeWidth={1} />
        <p className="font-bold text-xs uppercase tracking-widest">No history found</p>
      </div>
    );
  }

  // Explicit delete handler for the archive
  const handleDeleteMonth = (e: React.MouseEvent, month: MonthlyData) => {
    e.preventDefault();
    e.stopPropagation();

    // Allow deleting even if the month is not settled. (Users requested this to work reliably)
    const warning = month.isSettled
      ? ''
      : '\n\n⚠️ This month is NOT settled yet. Deleting it may remove important records.';

    if (confirm(`Are you sure you want to permanently delete the records for ${month.monthKey}?${warning}`)) {
      onDelete(month.monthKey);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-black tracking-tight">Previous Months</h2>

      <div className="space-y-4">
        {[...archive].sort((a,b) => b.monthKey.localeCompare(a.monthKey)).map((month) => {
          const settlements = calculateSettlements(month.expenses, month.roommates);
          const total = month.expenses.reduce((s, e) => s + e.amount, 0);

          return (
            <details key={month.monthKey} className="bg-white border-2 border-slate-100 rounded-2xl overflow-hidden group">
              <summary className="p-6 flex items-center justify-between cursor-pointer list-none select-none">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${month.isSettled ? 'bg-slate-100 text-black' : 'bg-amber-50 text-amber-600'}`}>
                    {month.isSettled ? <CheckCircle size={20} strokeWidth={3} /> : <Clock size={20} strokeWidth={3} />}
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-black">{month.monthKey}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Spent: {formatCurrency(total)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                   {!month.isSettled && (
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        onSettle(month.monthKey);
                      }}
                      className="bg-black text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest"
                    >
                      Settle
                    </button>
                  )}
                  <button 
                    type="button"
                    onClick={(e) => handleDeleteMonth(e, month)}
                    className="p-2 rounded-lg transition-colors text-slate-300 hover:text-red-500 hover:bg-red-50"
                    title="Delete Month"
                  >
                    <Trash2 size={20} strokeWidth={2.5} />
                  </button>
                  <ChevronDown className="group-open:rotate-180 transition-transform text-slate-400" />
                </div>
              </summary>
              
              <div className="px-6 pb-6 pt-2 border-t-2 border-slate-50 space-y-4">
                <h4 className="font-black text-[10px] uppercase text-slate-400 tracking-[0.2em]">Summary Record</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {settlements.map((s) => (
                    <div key={s.roommateId} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center">
                      <div className="min-w-0 flex-1">
                        <p className="font-black text-xs truncate text-black">{s.name}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Paid: {formatCurrency(s.paid)}</p>
                      </div>
                      <div className={`text-[10px] font-black ml-2 uppercase tracking-tighter ${s.balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {s.balance === 0 ? 'Settle' : s.balance > 0 ? `Owes ${formatCurrency(s.balance)}` : `Gains ${formatCurrency(Math.abs(s.balance))}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
};

export default Archive;
