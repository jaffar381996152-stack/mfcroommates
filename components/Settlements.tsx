
import React from 'react';
import { Expense, Roommate } from '../types';
import { calculateSettlements, formatCurrency } from '../utils';
import { CheckCircle2, AlertCircle, Wallet } from 'lucide-react';

interface SettlementsProps {
  expenses: Expense[];
  roommates: Roommate[];
  advances: Record<string, number>;
  onChangeAdvance: (roommateId: string, amount: number) => void;
}

const Settlements: React.FC<SettlementsProps> = ({ expenses, roommates, advances, onChangeAdvance }) => {
  const settlements = calculateSettlements(expenses, roommates, advances);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const perPerson = totalExpenses / (roommates.length || 1);
  const admin = roommates.find(r => r.isAdmin) || roommates[0];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-black">Settlements</h2>

      <section className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
        <div className="mb-6 flex justify-between items-end">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider mb-1">Who owes to Who</h3>
            <p className="text-xs text-slate-400 font-bold">Total Spent: <span className="text-black">{formatCurrency(totalExpenses)}</span></p>
          </div>
          <div className="text-right">
             <p className="text-[10px] text-slate-400 font-black uppercase">Share Per Person</p>
             <p className="text-sm font-black text-black">{formatCurrency(perPerson)}</p>
          </div>
        </div>

        <div className="space-y-3">
          {settlements.map((s) => (
            <div key={s.roommateId} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 border-2 border-transparent rounded-xl hover:border-slate-100 transition-all gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-white text-xs ${s.isAdmin ? 'bg-black' : 'bg-slate-300 text-slate-600'}`}>
                  {s.name[0]}
                </div>
                <div>
                  <p className="font-black text-sm flex items-center gap-2">
                    {s.name} {s.isAdmin && <span className="text-[8px] bg-black text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-widest">Admin</span>}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold">Paid: {formatCurrency(s.paid)}</p>
                  {!s.isAdmin && (
                    <div className="mt-2 flex items-center gap-2">
                      <label className="text-[9px] text-slate-400 font-black uppercase tracking-wider">Advance</label>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={advances[s.roommateId] ?? 0}
                        onChange={(e) => onChangeAdvance(s.roommateId, Number(e.target.value || 0))}
                        className="w-24 px-2 py-1 rounded-lg border-2 border-slate-100 bg-white text-[11px] font-black text-black focus:outline-none focus:border-slate-300"
                        placeholder="0"
                      />
                      <span className="text-[10px] text-slate-400 font-bold">SAR</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-right">
                {s.isAdmin ? (
                  <div className="flex flex-col items-end">
                    <span className="text-black font-black text-xs flex items-center gap-1">
                      <Wallet size={12} strokeWidth={3} /> Balance: {formatCurrency(s.balance)}
                    </span>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Admin's Wallet</p>
                  </div>
                ) : s.balance > 0 ? (
                  <div className="flex flex-col items-end">
                    <span className="text-red-600 font-black text-xs flex items-center gap-1">
                      <AlertCircle size={12} strokeWidth={3} /> Owes {formatCurrency(s.balance)}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase">Pay to {admin?.name}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-end">
                    <span className="text-emerald-600 font-black text-xs flex items-center gap-1">
                      <CheckCircle2 size={12} strokeWidth={3} /> Gets {formatCurrency(Math.abs(s.balance))}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase">Recv from {admin?.name}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="p-5 bg-black rounded-xl text-white shadow-xl">
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-3 text-slate-500">Admin Collection Status</h4>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase mb-1">To Collect</p>
            <p className="text-lg font-black">{formatCurrency(settlements.filter(s => s.balance > 0 && !s.isAdmin).reduce((a, b) => a + b.balance, 0))}</p>
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase mb-1">To Payout</p>
            <p className="text-lg font-black">{formatCurrency(Math.abs(settlements.filter(s => s.balance < 0 && !s.isAdmin).reduce((a, b) => a + b.balance, 0)))}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settlements;
