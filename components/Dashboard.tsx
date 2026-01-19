
import React, { useState } from 'react';
import { Expense, Roommate, Category } from '../types';
import { Plus, Trash2, Calendar } from 'lucide-react';
import { formatCurrency } from '../utils';

interface DashboardProps {
  expenses: Expense[];
  roommates: Roommate[];
  onAdd: (expense: Omit<Expense, 'id'>) => void;
  onDelete: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ expenses, roommates, onAdd, onDelete }) => {
  const [amount, setAmount] = useState('');
  const [payerId, setPayerId] = useState('');
  const [category, setCategory] = useState<Category>(Category.Groceries);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

  const today = new Date().toLocaleDateString('en-GB', { 
    day: 'numeric', month: 'long', year: 'numeric' 
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !payerId) return;
    
    onAdd({
      amount: parseFloat(amount),
      payerId,
      category,
      date: new Date().toISOString()
    });
    setAmount('');
  };

  const filteredExpenses = expenses.filter(e => e.date.startsWith(selectedDate));
  const dailyTotal = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-black">MFC Room Budget</h2>
          <p className="text-slate-500 font-bold text-sm flex items-center gap-2">
            <Calendar size={16} className="text-black" /> {today}
          </p>
        </div>
      </header>

      <section className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
        <h3 className="text-sm font-black mb-4 text-black uppercase tracking-wider">Add Spending</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Who Paid?</label>
            <select 
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:border-black text-black appearance-none"
              value={payerId}
              onChange={(e) => setPayerId(e.target.value)}
              required
            >
              <option value="">Select Roommate</option>
              {roommates.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Amount (SAR)</label>
            <input 
              type="number" 
              step="0.01"
              placeholder="0.00"
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:border-black text-black"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Category</label>
            <select 
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:border-black text-black appearance-none"
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
            >
              {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button type="submit" className="w-full bg-black text-white rounded-xl py-2 text-sm font-black flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors">
              <Plus size={18} strokeWidth={3} /> Add Entry
            </button>
          </div>
        </form>
      </section>

      <section className="bg-white rounded-2xl border-2 border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b-2 border-slate-50 flex items-center justify-between flex-wrap gap-4">
          <h3 className="text-sm font-black text-black uppercase tracking-wider">Daily Purchase Items</h3>
          <div className="flex items-center gap-4">
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-sm font-bold bg-slate-50 border-2 border-slate-100 rounded-lg px-3 py-1 focus:outline-none focus:border-black"
            />
            <div className="text-xs font-black bg-slate-100 px-3 py-1 rounded-full text-black">
              Total: {formatCurrency(dailyTotal)}
            </div>
          </div>
        </div>
        
        <div className="divide-y-2 divide-slate-50">
          {filteredExpenses.length > 0 ? (
            filteredExpenses.map((expense) => {
              const roommate = roommates.find(r => r.id === expense.payerId);
              return (
                <div key={expense.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white font-black uppercase text-xs">
                      {roommate?.name[0] || '?'}
                    </div>
                    <div>
                      <p className="font-black text-black text-sm">{roommate?.name || 'Unknown'}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{expense.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-black text-black text-sm">{formatCurrency(expense.amount)}</span>
                    <button 
                      onClick={() => onDelete(expense.id)}
                      className="text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center text-slate-400 font-bold text-sm">
              No entries found.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
